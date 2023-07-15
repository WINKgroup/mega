import Cmd, { CmdOptions } from '@winkgroup/cmd';
import ConsoleLog, { ConsoleLogLevel } from '@winkgroup/console-log';
import EventQueue from '@winkgroup/event-queue';
import { byteString } from '@winkgroup/misc';
import Network from '@winkgroup/network';
import fs from 'fs';
import glob from 'glob';
import _ from 'lodash';
import { EventEmitter } from 'node:events';
import os from 'os';
import Path from 'path';
import { Readable } from 'stream';
import { ChildProcessWithoutNullStreams } from 'node:child_process';

import {
    getBytesByChildren,
    MegaCmdDfResult,
    MegaCmdDfResultSection,
    MegaCmdFile,
    MegaCmdGetTransferResult,
    MegaCmdLsOptions,
    MegaCmdLsResult,
    MegaCmdRmOptions,
    MegaTransferFile,
    MegaTransferResult,
} from './common';

export interface MegaCmdOptions {
    consoleLog: ConsoleLog;
}

export interface MegaCmdGetOptions extends CmdOptions {
    merge: boolean;
    usePcre: boolean;
    onProgress?: EventEmitter;
}

export interface MegaCmdPutOptions extends CmdOptions {
    createRemoteFolder: boolean;
    onProgress?: EventEmitter;
}

export class MegaCmd {
    protected runningCmd = null as Cmd | null;
    consoleLog: ConsoleLog;

    protected static started: boolean | null = false;

    protected static lockedBy = '';
    static onIdle = new EventQueue();
    static getLockedBy() {
        return this.lockedBy;
    }
    static consoleLog = new ConsoleLog({ prefix: 'MegaCmd' });

    protected constructor(inputOptions?: Partial<MegaCmdOptions>) {
        const options: MegaCmdOptions = _.defaults(inputOptions, {
            consoleLog: MegaCmd.consoleLog.spawn(),
        });
        this.consoleLog = options.consoleLog;
    }

    protected async run(cmd: string, inputCmdOptions?: Partial<CmdOptions>) {
        const cmdOptions: Partial<CmdOptions> = _.defaults(inputCmdOptions, {
            stderrOptions: { logLevel: ConsoleLogLevel.DEBUG },
        });

        this.runningCmd = new Cmd(cmd, cmdOptions);
        const cmdObj = await this.runningCmd.run();
        return cmdObj;
    }

    getCmdOutput(stream = 'stdout' as 'stdout' | 'stderr') {
        const cmd = this.runningCmd!;
        return stream === 'stdout' ? cmd.stdout.data : cmd.stderr.data;
    }

    getCmdExitCode() {
        if (!this.runningCmd) return null;
        return this.runningCmd.exitCode;
    }

    async whoAmI() {
        await this.run('mega-whoami', {
            consoleLog: new ConsoleLog({ verbosity: ConsoleLogLevel.NONE }),
        });
        let result = this.getCmdOutput();
        if (result.indexOf('Not logged in') !== -1) return null;
        result = result.substring('Account e-mail: '.length).trim();

        if (
            result &&
            !result.match(/^\w+([\.\+-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
        ) {
            const message = `"${this.getCmdOutput()}" has no valid email`;
            this.consoleLog.error(`whoAmI ${message}`);
            throw new Error(message);
        }
        return result ? result : null;
    }

    async login(email: string, password: string) {
        const currentEmail = await this.whoAmI();
        if (currentEmail === email) return true;
        if (currentEmail) await this.logout();
        const cmd = await this.run('mega-login', {
            args: [email, password],
            consoleLog: new ConsoleLog({ verbosity: ConsoleLogLevel.NONE }),
        });
        const newEmail = await this.whoAmI();
        if (newEmail === email) {
            this.consoleLog.print(`logged as ${email}`);
            this.consoleLog.generalOptions.id = email;
            return true;
        } else {
            this.consoleLog.warn(`unable to login as ${email}`);
            this.consoleLog.debug(cmd.stderr.data);
            return false;
        }
    }

    async logout() {
        await this.run('mega-logout', {
            getResult: false,
            consoleLog: new ConsoleLog({ verbosity: ConsoleLogLevel.NONE }),
        });
        this.consoleLog.print('logout');
        delete this.consoleLog.generalOptions.id;
    }

    async df(): Promise<MegaCmdDfResult | false> {
        let output = '';
        let usedBytes = 0;
        let totalBytes = 0;
        let fileVersionsBytes = 0;
        let drive: MegaCmdDfResultSection;
        let inbox: MegaCmdDfResultSection;
        let trash: MegaCmdDfResultSection;
        const ref = this;

        function parsingError(line: string) {
            ref.consoleLog.warn(`Unable to parse df result at line ${line}`);
            return false;
        }

        function setDataFromUsedStorageLine(line: string) {
            const matches = line.match(
                /USED STORAGE:\s+(\d+)\s+([^\s]+) of (\d+)/,
            );
            if (!matches) return parsingError(line);
            usedBytes = parseInt(matches[1]);
            totalBytes = parseInt(matches[3]);
            return true;
        }

        function setDataFromFileVersionsLine(line: string) {
            const matches = line.match(
                /Total size taken up by file versions:\s+(\d+)/,
            );
            if (!matches) return parsingError(line);
            fileVersionsBytes = parseInt(matches[1]);
            return true;
        }

        function setDataFromGeneralLine(line: string) {
            const matches = line.match(
                /(.+):\s+(\d+) in\s+(\d+) file\(s\) and\s+(\d+) folder\(s\)/,
            );
            if (!matches) return parsingError(line);
            const result: MegaCmdDfResultSection = {
                bytes: parseInt(matches[2]),
                numOfFiles: parseInt(matches[3]),
                numOfFolders: parseInt(matches[4]),
            };
            switch (matches[1]) {
                case 'Cloud drive':
                    drive = result;
                    break;
                case 'Inbox':
                    inbox = result;
                    break;
                case 'Rubbish bin':
                    trash = result;
                    break;
                default:
                    return parsingError(line);
            }
            return true;
        }

        const sections = ['Cloud drive:', 'Inbox:', 'Rubbish bin:'];
        await this.run('mega-df', {
            consoleLog: new ConsoleLog({ verbosity: ConsoleLogLevel.NONE }),
        });
        output = this.getCmdOutput();

        const lines = output.split('\n');
        for (const line of lines) {
            let parsingResult = true;
            if (line.indexOf('USED STORAGE:') !== -1)
                parsingResult = setDataFromUsedStorageLine(line);
            if (line.indexOf('Total size taken up by file versions:') !== -1)
                parsingResult = setDataFromFileVersionsLine(line);

            for (const section of sections)
                if (line.indexOf(section) !== -1)
                    parsingResult = setDataFromGeneralLine(line);

            if (!parsingResult) return false; // parsing error
        }

        const freeBytes = totalBytes - usedBytes;
        const result: MegaCmdDfResult = {
            trash: trash!,
            drive: drive!,
            inbox: inbox!,
            freeBytes: freeBytes,
            totalBytes: totalBytes,
            fileVersionsBytes: fileVersionsBytes,
        };

        this.consoleLog.print(
            `df -> ${byteString(freeBytes)} / ${byteString(totalBytes)}`,
        );
        return result;
    }

    async ls(remotepath = '', inputOptions?: Partial<MegaCmdLsOptions>) {
        const ref = this;

        const options: MegaCmdLsOptions = _.defaults(inputOptions, {
            usePcre: false,
            recursive: false,
        });

        const result: MegaCmdLsResult = {
            state: 'success',
        };

        function isHeaderValid(lines: string[]) {
            const header1 = lines.shift();
            if (!header1) return false;
            if (header1.substring(0, 5) === 'FLAGS') return true;
            const header2 = lines.shift();
            if (!header2) return false;
            return header2.substring(0, 5) === 'FLAGS';
        }

        function isDirectory(flags: string) {
            const firstFlag = flags[0];
            switch (firstFlag) {
                case 'd':
                    return true;
                case '-':
                    return false;
                default:
                    const err = `Unable to parse flags in mega-ls: ${flags}`;
                    ref.consoleLog.error(err);
                    result.state = 'error';
                    result.error = err;
            }
            return null;
        }

        const args = [remotepath, '-l', '--time-format=ISO6081_WITH_TIME'];
        if (options.usePcre) args.push('--use-pcre');

        await this.run('mega-ls', {
            args: args,
            consoleLog: new ConsoleLog({ verbosity: ConsoleLogLevel.NONE }),
        });
        const outputStr = this.getCmdOutput();
        if (outputStr.indexOf("Couldn't find") !== -1) return result;

        const lines = outputStr.split('\n');
        if (!isHeaderValid(lines)) {
            const err = 'Unrecognized header in mega-ls';
            this.consoleLog.error(err);
            result.state = 'error';
            result.error = err;
            return result;
        }

        const files = [] as MegaCmdFile[];
        for (const line of lines) {
            if (!line) continue;
            const match = line.match(
                /([\S]{4})\s+(\d+|-)\s+(\d+|-)\s+([\S]{19})\s+(.+)/,
            );
            if (!match) {
                const err = `Unable to parse mega-ls line: ${line}`;
                this.consoleLog.error(err);
                result.state = 'error';
                result.error = err;
                return result;
            }

            const flags = match[1];
            const versions = parseInt(match[2]) !== 0 ? parseInt(match[2]) : 0;
            const bytes = parseInt(match[3]) !== 0 ? parseInt(match[3]) : 0;
            const time = match[4];
            const name = match[5];

            const isDir = isDirectory(flags);
            if (isDir === null) return result;

            let fullPath =
                await this.getRemoteAbsolutePathWithCurrentWorkingDirectory(
                    remotepath,
                );
            if (fullPath === false) {
                result.state = 'error';
                result.error = `unable to get fullPath for "${remotepath}" remotepath`;
                return result;
            }
            fullPath = Path.join(fullPath, name);
            const el: MegaCmdFile = {
                name: name,
                path: fullPath,
                type: 'file',
                updatedAt: time,
            };

            if (versions > 1) el.versions = versions;
            if (bytes > 0) el.bytes = bytes;

            if (isDirectory(flags)) {
                el.type = 'directory';
                if (options.recursive) {
                    const childResult = await this.ls(fullPath, inputOptions);
                    if (childResult.state === 'error') {
                        result.state = 'error';
                        result.error = childResult.error;
                        return result;
                    }
                    const child = childResult.file as MegaCmdFile;
                    const childrenBytes = getBytesByChildren(child);
                    if (childrenBytes === false) {
                        const err = `Unable to determinate bytes for directory "${el.name}"`;
                        this.consoleLog.warn(err);
                        result.error = err;
                        result.state = 'error';
                        return result;
                    } else el.bytes = childrenBytes;
                    el.children = child.children;
                }
            }

            files.push(el);
        }

        if (files.length === 1 && files[0].type === 'file')
            result.file = files[0];
        else {
            const fullPath =
                await this.getRemoteAbsolutePathWithCurrentWorkingDirectory(
                    remotepath,
                );
            if (fullPath === false) {
                result.state = 'error';
                result.error = `unable to get fullPath for "${remotepath}" remotepath`;
                return result;
            }
            const dir: MegaCmdFile = {
                name: MegaCmd.getNameFromPath(remotepath),
                path: fullPath,
                type: 'directory',
                children: files,
            };
            const bytes = getBytesByChildren(dir);
            if (bytes) dir.bytes = bytes;

            result.file = dir;
        }

        return result;
    }

    async pwd() {
        const cmd = await this.run('mega-pwd', {
            consoleLog: new ConsoleLog({ verbosity: ConsoleLogLevel.NONE }),
        });

        return cmd.exitCode === 0 ? cmd.stdout.data.trim() : false;
    }

    async getRemotePathType(remotepath: string) {
        const result = await this.ls(remotepath);
        if (result.state === 'error') return false;
        if (!result.file) return 'none';
        return result.file.type;
    }

    async getRemoteAbsolutePathWithCurrentWorkingDirectory(remotepath: string) {
        if (remotepath[0] === '/') return remotepath;
        const pwd = await this.pwd();
        if (pwd === false) return false;
        if (!remotepath) return pwd;
        return pwd[pwd.length - 1] !== '/'
            ? pwd + '/' + remotepath
            : pwd + remotepath;
    }

    async put2transfers(localpath: string | string[], remotepath = '') {
        const result: MegaTransferResult = {
            totalBytes: 0,
            transfers: [],
        };
        if (typeof localpath !== 'string') {
            for (const localpathEl of localpath) {
                const resultEl = await this.put2transfers(
                    localpathEl,
                    remotepath,
                );
                if (!resultEl) return false;
                result.totalBytes += resultEl.totalBytes;
                result.transfers = result.transfers.concat(resultEl.transfers);
            }
            return result;
        }

        let escapedLocalpath = localpath;
        escapedLocalpath = escapedLocalpath.replace(/\?/, '\\?');
        escapedLocalpath = escapedLocalpath.replace(/\!/, '\\!');
        escapedLocalpath = escapedLocalpath.replace(/\]/, '\\]');
        escapedLocalpath = escapedLocalpath.replace(/\[/, '\\[');
        escapedLocalpath = escapedLocalpath.replace(/\(/, '\\(');
        escapedLocalpath = escapedLocalpath.replace(/\)/, '\\(');

        const list = glob.sync(escapedLocalpath, { dot: true });
        if (list.length === 0) return result;

        const workingDir = process.cwd();
        const remotepathType = await this.getRemotePathType(remotepath);
        if (remotepathType === false) {
            this.consoleLog.error(
                'unable to get remote path type in put2transfers',
            );
            return false;
        }
        const remoteBasePath =
            await this.getRemoteAbsolutePathWithCurrentWorkingDirectory(
                remotepath,
            );
        if (remoteBasePath === false) {
            this.consoleLog.error('unable to get remote base path');
            return false;
        }

        const addTransferToResult = (localpath: string, stats?: fs.Stats) => {
            if (!stats) stats = fs.statSync(localpath);
            const absLocalPath = Path.resolve(workingDir, localpath);
            const localFilename = Path.basename(absLocalPath);
            let absRemotePath = remoteBasePath;
            if (remotepathType === 'directory') absRemotePath += localFilename;
            const transfer: MegaTransferFile = {
                direction: 'upload',
                sourcePath: absLocalPath,
                destinationPath: absRemotePath,
                bytes: stats.size,
            };

            result.totalBytes += stats.size;
            result.transfers.push(transfer);
            return true;
        };

        for (const localpath of list) {
            const stats = fs.statSync(localpath);
            if (stats.isDirectory()) {
                const subList = glob.sync(Path.join(localpath, '**/*'), {
                    dot: true,
                    nodir: true,
                });
                for (const subFilename of subList)
                    addTransferToResult(subFilename);
            } else addTransferToResult(localpath, stats);
        }

        return result;
    }

    async put(
        localpath: string | string[],
        remotepath = '',
        inputOptions?: Partial<MegaCmdPutOptions>,
    ) {
        const options: Partial<MegaCmdPutOptions> = _.defaults(inputOptions, {
            args: [],
            createRemoteFolder: false,
            getResult: false,
            timeout: 2 * 3600,
        });

        const args = [];
        if (options.createRemoteFolder) args.push('-c');
        if (typeof localpath !== 'string') localpath.map((p) => args.push(p));
        else args.push(localpath);
        if (remotepath) args.push(remotepath);
        else if (typeof localpath !== 'string' && localpath.length > 1)
            args.push();
        options.args = args;

        const cmd = new Cmd('mega-put', options);

        await this.progress(cmd, options.onProgress);
        return cmd.exitCode === 0;
    }

    async get(
        remotepath: string,
        localpath = '',
        inputOptions?: Partial<MegaCmdGetOptions>,
    ) {
        const options: MegaCmdGetOptions = _.defaults(inputOptions, {
            args: [],
            usePcre: false,
            merge: false,
            getResult: false,
            timeout: 2 * 3600,
            consoleLogGeneralOptions: {},
        });

        const args = [];
        if (options.merge) args.push('--use-pcre');
        if (options.usePcre) args.push('--use-pcre');
        args.push(remotepath);
        if (localpath) args.push(localpath);
        options.args = args;

        const cmd = new Cmd('mega-get', options);
        await this.progress(cmd);
        return cmd.exitCode === 0;
    }

    protected async progress(cmd: Cmd, inputOptions?: EventEmitter) {
        cmd.consoleLog = this.consoleLog.spawn();
        cmd.stderr.logLevel = ConsoleLogLevel.DEBUG;
        const onProgress = inputOptions;
        const mega = this;
        let started = false;
        let progressData = { bytes: 0, totalBytes: 0, percentage: 0 };

        function transferringParser(text: string) {
            const parsed = text.match(
                /\((\d+)\/(\d+)\s+([^:]+):\s+([0-9.]+)\s+%\)/,
            );
            if (!parsed) {
                mega.consoleLog.warn(`transferring parsing error: ${text}`);
                return null;
            }

            let unit = 1;
            switch (parsed[3]) {
                case 'KB':
                    unit = 1000;
                    break;
                case 'MB':
                    unit = 1000000;
                    break;
                case 'GB':
                    unit = 1000000000;
                    break;
                default:
                    mega.consoleLog.warn(
                        `transferring parsing unit unknown: ${parsed[3]}`,
                    );
                    return null;
            }

            return {
                bytes: parseInt(parsed[1]) * unit,
                totalBytes: parseInt(parsed[2]) * unit,
                percentage: parseFloat(parsed[4]),
            };
        }

        function listener(data: Error | Buffer) {
            if (Buffer.isBuffer(data)) {
                const text = data.toString();
                if (text.indexOf('TRANSFERRING') !== -1) {
                    const info = transferringParser(text);
                    if (info) {
                        progressData = info;
                        if (!started) {
                            started = true;
                            onProgress!.emit('started', {
                                totalBytes: info.totalBytes,
                            });
                        }
                        onProgress!.emit('progress', info);
                    }
                }
            }
        }

        function transferActionMessage(
            action: string,
            success: boolean,
            tag?: number,
        ) {
            const secondPart = tag
                ? `transfer with tag ${tag}`
                : 'all transfers';
            if (success)
                mega.consoleLog.print(`${secondPart}: ${action} success`);
            else {
                const err = `unable to ${action} ` + secondPart;
                mega.consoleLog.warn(err);
            }
        }

        return new Promise<void>(async (resolve) => {
            const childProcess = cmd.start();

            if (childProcess) {
                if (onProgress) {
                    const transfers = await mega.getTransfers();
                    if (transfers) onProgress.emit('transfers', transfers);
                    else
                        mega.consoleLog.warn(
                            'unable to get transfers during progress',
                        );

                    cmd.stderr.addListener('data', listener);

                    onProgress.on('stop', async (tag?: number) => {
                        const result = await this.cancelTransfers(tag);
                        transferActionMessage('stop', result, tag);
                        onProgress.emit('stopped', { result: result });
                    });
                    onProgress.on('resume', async (tag?: number) => {
                        const result = await this.resumeTransfers(tag);
                        transferActionMessage('resume', result, tag);
                        onProgress.emit('resumed', { result: result });
                    });
                    onProgress.on('pause', async (tag?: number) => {
                        const result = await this.pauseTransfers(tag);
                        transferActionMessage('pause', result, tag);
                        onProgress.emit('paused', { result: result });
                    });
                }
                childProcess.on('close', () => {
                    if (onProgress) {
                        onProgress.emit('ended', progressData);
                        cmd.stderr.removeListener('data', listener);
                    }
                    resolve();
                });
            } else resolve();
        });
    }

    async getTransfers() {
        const cmd = await this.run('mega-transfers', {
            args: ['--path-display-size=10000'],
            consoleLog: new ConsoleLog({ verbosity: ConsoleLogLevel.NONE }),
        });
        const lines = cmd.stdout.data.split('\n');
        let generalState = 'running';
        if (lines[0].indexOf('PAUSED') !== -1) {
            lines.shift();
            generalState = 'paused';
        }
        lines.shift(); // remove header

        const result = [] as MegaCmdGetTransferResult[];

        for (const line of lines) {
            if (!line) continue;
            const fields = line.split(' ').filter((field) => !!field);

            // first field: direction
            let direction = '';
            switch (fields[0]) {
                case '⇓':
                    direction = 'download';
                    break;
                case '⇑':
                    direction = 'upload';
                    break;
                case '⇵':
                    direction = 'sync';
                    break;
                case '⏫':
                    direction = 'backup';
                    break;
                default:
                    this.consoleLog.error(
                        `unrecognized "${fields[0]}" symbol in transfer command`,
                    );
                    return false;
            }

            // second field: tag
            const tag = parseInt(fields[1]);
            if (tag === 0) {
                this.consoleLog.error(
                    `unrecognized "${fields[1]}" tag in transfer command`,
                );
                return false;
            }

            // fifth field: percentage
            const percentage = parseFloat(fields[4]);

            // bytes
            let totalBytes = parseFloat(fields[6]);
            switch (fields[7]) {
                case 'KB':
                    totalBytes *= 1000;
                    break;
                case 'MB':
                    totalBytes *= 1000000;
                    break;
                case 'GB':
                    totalBytes *= 1000000000;
                    break;
                default:
                    this.consoleLog.error(
                        `unrecognized "${fields[7]}" as totalBytes unit in transfer command`,
                    );
                    return false;
            }

            // state
            let state = fields[8].toLowerCase();
            if (generalState === 'paused') state = 'paused';

            const el: MegaCmdGetTransferResult = {
                direction: direction,
                tag: tag,
                sourcePath: fields[2],
                destinationPath: fields[3],
                percentage: percentage,
                totalBytes: totalBytes,
                state: state,
            };
            result.push(el);
        }

        return result;
    }

    protected async actionTransfers(actionOption: string, tag?: number) {
        const args = [actionOption] as string[];
        args.push(tag ? tag.toString() : '-a');
        const cmd = await this.run('mega-transfers', { args: args });
        return cmd.exitCode === 0;
    }

    pauseTransfers(tag?: number) {
        return this.actionTransfers('-p', tag);
    }
    resumeTransfers(tag?: number) {
        return this.actionTransfers('-r', tag);
    }
    cancelTransfers(tag?: number) {
        return this.actionTransfers('-c', tag);
    }

    async rm(remotepath: string, inputOptions?: Partial<MegaCmdRmOptions>) {
        const options: MegaCmdRmOptions = _.defaults(inputOptions, {
            usePcre: false,
            recursive: false,
            getResult: false,
        });

        const args = ['-f'];
        if (options.recursive) args.push('-r');
        if (options.usePcre) args.push('--use-pcre');
        args.push(remotepath);

        const cmd = await this.run('mega-rm', { args: args });
        return cmd.exitCode === 0;
    }

    async signup(email: string, password: string) {
        await this.logout();
        const cmd = await this.run('mega-signup', {
            args: [email, password],
            consoleLog: new ConsoleLog({ verbosity: ConsoleLogLevel.NONE }),
        });
        if (cmd.stdout.data.indexOf('Already exists') !== -1) {
            this.consoleLog.warn(`unable to signup ${email}: already exists`);
            return false;
        }
        if (
            cmd.stdout.data.indexOf(
                'created succesfully. You will receive a confirmation link',
            ) !== -1
        ) {
            this.consoleLog.print(
                `${email} signup success, waiting for confirmation...`,
            );
            return true;
        }
        this.consoleLog.error(`unable to parse mega-signup result`);
        console.error('output:', cmd.stdout.data);
        console.error('error:', cmd.stderr.data);
        return false;
    }

    async confirm(link: string, email: string, password: string) {
        await this.logout();
        const cmd = await this.run('mega-confirm', {
            args: [link, email, password],
            consoleLog: new ConsoleLog({ verbosity: ConsoleLogLevel.NONE }),
        });

        if (
            cmd.stdout.data.indexOf(
                'confirmed succesfully. You can login with it now',
            ) !== -1
        ) {
            this.consoleLog.print(`${email} account created and confirmed!`);
            return true;
        }

        this.consoleLog.error(`unable to parse mega-confirm result`);
        console.error('output:', cmd.stdout.data);
        console.error('error:', cmd.stderr.data);
        return false;
    }

    // unfortunaly this command is not accessible from a non interactive shell, we need a wokaround OS dependant
    // tested on: Mac & Ubuntu
    masterkey() {
        let command = '';
        switch (os.platform()) {
            case 'darwin':
                command = 'MegaCmdShell';
                break;
            case 'linux':
                command = 'mega-cmd';
                break;
            default:
                throw new Error(
                    'platform not implemented for mega-masterkey method',
                );
        }

        return new Promise<string | false>((resolve) => {
            const cmd = new Cmd(command, {
                consoleLog: new ConsoleLog({ verbosity: ConsoleLogLevel.WARN }),
            });
            const str = new Readable();
            const childProcess = cmd.start() as ChildProcessWithoutNullStreams;
            childProcess.on('close', () => {
                if (cmd.stdout.data.indexOf('Not logged in.') !== -1) {
                    this.consoleLog.warn(
                        `user not logged: unable to get masterkey`,
                    );
                    resolve(false);
                    return;
                }

                const matches = cmd.stdout.data.match(/\:\/\$ (\S{22})\n/);
                if (!matches) {
                    this.consoleLog.error(
                        `unable to parse output in masterkey`,
                    );
                    console.error(cmd.stdout.data);
                    resolve(false);
                    return;
                }
                const masterkey = matches[1];
                resolve(masterkey);
            });
            str.pipe(childProcess.stdin);
            str.push('masterkey');
            str.push(null);
        });
    }

    static async isIdle() {
        if (this.lockedBy || this.started === null) return false;
        if (this.started === false) await this.startup();
        const isOnline = await Network.get().hasInternetAccess();

        return isOnline;
    }

    static async getProxy() {
        const mega = new MegaCmd();
        const output = (
            await mega.run('mega-proxy', {
                consoleLog: new ConsoleLog({ verbosity: ConsoleLogLevel.WARN }),
            })
        ).stdout.data;
        if (output.indexOf('Proxy disabled') !== -1) return null;

        const lines = output.split('\n');
        let type = '';
        let url = '';
        for (const line of lines) {
            const typeMatch = line.match(/Type = ([^\s]+)/);
            if (typeMatch) type = typeMatch[1];
            const urlMatch = line.match(/URL = ([^\s]+)/);
            if (urlMatch) url = urlMatch[1];
        }
        if (!type || (type === 'CUSTOM' && !url))
            throw new Error(`unable to parse properly mega proxy: ${output}`);
        return {
            type: type,
            url: url,
        };
    }

    static async setProxy(type: 'none' | 'auto' | string) {
        const mega = new MegaCmd({
            consoleLog: new ConsoleLog({ verbosity: ConsoleLogLevel.NONE }),
        });
        let typeStr = type;
        if (type === 'none') typeStr = '--none';
        if (type === 'auto') typeStr = '--auto';
        await mega.run('mega-proxy', {
            getResult: false,
            args: [typeStr],
        });

        const proxyInfo = await this.getProxy();
        if (!proxyInfo && type === 'none') return '';
        if (type === 'auto' && proxyInfo!.type === 'AUTO') return '';
        if (proxyInfo!.type === 'CUSTOM') return '';
        throw 'unable to properly set proxy';
    }

    static async startup() {
        if (this.started) return true;
        if (this.started === null) return false;
        this.started = null;
        const mega = new MegaCmd();
        mega.consoleLog.print('waiting for Mega Server startup...');
        try {
            await mega.run('mega-help', {
                timeout: 30,
                getResult: false,
                consoleLog: new ConsoleLog({ verbosity: ConsoleLogLevel.NONE }),
            });
            mega.consoleLog.print('Mega Server ready');
            this.started = true;
            return true;
        } catch (e) {
            const message = `${e}`;
            if (message.indexOf('ENOENT') !== -1)
                mega.consoleLog.error(
                    'mega-help not found, probably mega not installed!',
                );
            else mega.consoleLog.warn(message);
            return false;
        }
    }

    static async get(lockedBy?: string) {
        if (this.started === null) return null; // startup running
        if (!this.started) await this.startup();

        const isIdle = await this.isIdle();
        if (!isIdle) return null;

        if (!lockedBy) lockedBy = 'unknown';
        this.lockedBy = lockedBy;

        this.consoleLog.debug(`${lockedBy} locked`);
        const mega = new MegaCmd();
        return mega;
    }

    static unlock(lockedBy: string) {
        if (!this.lockedBy) {
            this.consoleLog.warn('already unlocked');
            return true;
        }
        if (lockedBy !== this.lockedBy) {
            this.consoleLog.warn(
                `wrong lockingSecret ${this.lockedBy} != ${lockedBy}`,
            );
            return false;
        }

        this.consoleLog.debug(`${lockedBy} unlocked`);
        this.lockedBy = '';
        this.onIdle.fire();
        return true;
    }

    static getOrWait(lockedBy?: string, timeoutInSeconds = 3600) {
        return new Promise<MegaCmd | null>(async (resolve) => {
            const startedAt = new Date().getTime();
            let resolved = false;
            let megaCmd = await this.get(lockedBy);
            let timeoutFunction = null as NodeJS.Timeout | null;
            if (megaCmd) {
                resolve(megaCmd);
                return;
            }
            const network = Network.get();
            const hasInternetAccess = await network.hasInternetAccess();
            const onlineAgain = async () => {
                if (resolved) return;
                this.consoleLog.debug(`${lockedBy} getOrWait online again...`);
                setResolved();
            };
            const setResolved = () => {
                resolved = true;
                const timeSpent = (new Date().getTime() - startedAt) / 1000;
                if (timeoutFunction) clearTimeout(timeoutFunction);
                network.off('online', onlineAgain);
                resolve(
                    this.getOrWait(
                        lockedBy,
                        timeoutInSeconds ? timeoutInSeconds - timeSpent : 0,
                    ),
                );
            };

            if (!hasInternetAccess) network.once('online', onlineAgain);

            if (timeoutInSeconds) {
                timeoutFunction = setTimeout(() => {
                    if (resolved) return;
                    network.off('online', onlineAgain);
                    resolved = true;
                    this.consoleLog.debug(
                        `${lockedBy} getOrWait timeout triggered`,
                    );
                    resolve(null);
                }, timeoutInSeconds * 1000);
            }

            this.onIdle.add(() => {
                if (resolved) return;
                this.consoleLog.debug(
                    `${lockedBy} getOrWait unlocked triggered`,
                );
                setResolved();
            });
        });
    }

    static getNameFromPath(path: string) {
        const lastSlash = path.lastIndexOf('/');
        return lastSlash !== -1 ? path.substring(lastSlash + 1) : path;
    }

    static concatPaths(path1: string, path2: string) {
        if (path1[path1.length - 1] === '/' || path2[0] === '/')
            return path1 + path2;
        return path1 + '/' + path2;
    }
}
