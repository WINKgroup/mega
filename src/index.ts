import Cmd, { CmdOptions } from "@winkgroup/cmd"
import ConsoleLog, { LogLevel } from "@winkgroup/console-log"
import EventQueue from "@winkgroup/event-queue"
import { byteString } from "@winkgroup/misc"
import Network from "@winkgroup/network"
import _ from "lodash"
import { EventEmitter } from "node:events"

import { getBytesByChildren, MegaCmdFile, MegaCmdOptions, MegaDfResult, MegaDfResultSection,  MegaLsOptions, MegaLsResult, MegaRmOptions } from "./common"

/***********     MEGA GET       ***********/

export interface MegaGetOptions extends CmdOptions {
    merge: boolean
    usePcre: boolean
    onTransfer?: EventEmitter
}

/***********      MEGA PUT       ***********/

export interface MegaPutOptions extends CmdOptions {
    createRemoteFolder: boolean
    onTransfer?: EventEmitter
}

export default class MegaCmd {
    protected runningCmd = null as Cmd | null
    consoleLog:ConsoleLog
    
    protected static started:boolean | null = false

    protected static lockedBy = ''
    static onIdle = new EventQueue()
    static getLockedBy() { return this.lockedBy }
    static consoleLog = new ConsoleLog({ prefix: 'MegaCmd' })

    protected constructor(inputOptions?:Partial<MegaCmdOptions>) {
        const options:MegaCmdOptions = _.defaults(inputOptions, {
            consoleLog: MegaCmd.consoleLog.spawn()
        })
        this.consoleLog = options.consoleLog
    }

    protected async run(cmd:string, inputCmdOptions?:Partial<CmdOptions>) {
        const cmdOptions:Partial<CmdOptions> = _.defaults(inputCmdOptions, { stderrOptions: { logLevel: LogLevel.DEBUG } })

        this.runningCmd = new Cmd(cmd, cmdOptions)
        const cmdObj = await this.runningCmd.run()
        return cmdObj
    }

    getCmdOutput(stream = 'stdout' as 'stdout' | 'stderr') {
        const cmd = this.runningCmd!
        return stream === 'stdout' ? cmd.stdout.data : cmd.stderr.data
    }

    async whoAmI() {
        await this.run('mega-whoami', { consoleLogGeneralOptions: { verbosity: LogLevel.NONE } })
        let result = this.getCmdOutput()
        if (result.indexOf('Not logged in') !== -1) return null
        result = result.substring('Account e-mail: '.length).trim()

        if (result && !result.match(/^\w+([\.\+-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
            const message = `"${this.getCmdOutput()}" has no valid email`
            this.consoleLog.error(`whoAmI ${message}`)
            throw new Error(message)
        }
        return result ? result : null
    }

    async login (email:string, password:string) {
        const currentEmail = await this.whoAmI()
        if (currentEmail === email) return true
        if (currentEmail) await this.logout()
        const cmd = await this.run('mega-login', {
            args: [email, password],
            consoleLogGeneralOptions: { verbosity: LogLevel.NONE }
        }, )
        const newEmail = await this.whoAmI()
        if(newEmail === email) {
            this.consoleLog.print(`logged as ${ email }`)
            this.consoleLog.generalOptions.id = email
            return true
        } else {
            this.consoleLog.warn(`unable to login as ${ email }`)
            this.consoleLog.debug(cmd.stderr.data)
            return false
        }
    }

    async logout () {
        await this.run('mega-logout', { getResult: false })
        delete this.consoleLog.generalOptions.id
    }

    async df():Promise<MegaDfResult | false> {
        let output = ''
        let usedBytes = 0
        let totalBytes = 0
        let fileVersionsBytes = 0
        let drive:MegaDfResultSection
        let inbox:MegaDfResultSection
        let trash:MegaDfResultSection
        const ref = this

        function parsingError(line:string) {
            ref.consoleLog.warn(`Unable to parse df result at line ${line}`)
            return false
        }

        function setDataFromUsedStorageLine(line:string) {
            const matches = line.match(/USED STORAGE:\s+(\d+)\s+([^\s]+) of (\d+)/)
            if (!matches) return parsingError(line)
            usedBytes = parseInt(matches[1])
            totalBytes = parseInt(matches[3])
            return true
        }

        function setDataFromFileVersionsLine(line:string) {
            const matches = line.match(/Total size taken up by file versions:\s+(\d+)/)
            if (!matches) return parsingError(line)
            fileVersionsBytes = parseInt(matches[1])
            return true
        }

        function setDataFromGeneralLine(line:string) {
            const matches = line.match(/(.+):\s+(\d+) in\s+(\d+) file\(s\) and\s+(\d+) folder\(s\)/)
            if (!matches) return parsingError(line)
            const result:MegaDfResultSection = {
                bytes: parseInt(matches[2]),
                numOfFiles: parseInt(matches[3]),
                numOfFolders: parseInt(matches[4])
            }
            switch (matches[1]) {
                case 'Cloud drive':     drive = result;     break
                case 'Inbox':           inbox = result;     break
                case 'Rubbish bin':     trash = result;     break
                default:                return parsingError(line)

            }
            return true
        }

        const sections = ['Cloud drive:', 'Inbox:', 'Rubbish bin:']
        await this.run('mega-df', { consoleLogGeneralOptions: { verbosity: LogLevel.NONE } })
        output = this.getCmdOutput()

        const lines = output.split("\n")
        for (const line of lines) {
            let parsingResult = true
            if (line.indexOf('USED STORAGE:') !== -1) parsingResult = setDataFromUsedStorageLine(line)
            if (line.indexOf('Total size taken up by file versions:') !== -1) parsingResult = setDataFromFileVersionsLine(line)
            
            for (const section of sections)
                if (line.indexOf(section) !== -1) parsingResult = setDataFromGeneralLine(line)

            if (!parsingResult) return false // parsing error
        }

        const freeBytes = totalBytes - usedBytes
        const result:MegaDfResult = {
            trash: trash!,
            drive: drive!,
            inbox: inbox!,
            freeBytes: freeBytes,
            totalBytes: totalBytes,
            fileVersionsBytes: fileVersionsBytes
        }

        this.consoleLog.print(`df -> ${ byteString(freeBytes) } / ${ byteString(totalBytes) }`)
        return result
    }

    async ls(remotepath = '', inputOptions?:Partial<MegaLsOptions>) {
        const ref = this

        const options:MegaLsOptions = _.defaults(inputOptions, {
            usePcre: false,
            recursive: false
        })

        const result:MegaLsResult = {
            state: 'success'
        }

        function isHeaderValid(lines:string[]) {
            const header1 = lines.shift()
            if (!header1) return false
            if (header1.substring(0, 5) === 'FLAGS') return true
            const header2 = lines.shift()
            if (!header2) return false
            return header2.substring(0, 5) === 'FLAGS'
        }
        
        function isDirectory(flags:string) {
            const firstFlag = flags[0]
            switch (firstFlag) {
                case 'd': return true
                case '-': return false
                default:
                    const err = `Unable to parse flags in mega-ls: ${flags}`
                    ref.consoleLog.error(err)
                    result.state = 'error'
                    result.error = err
            }
            return null
        }

        const args = [remotepath, '-l', '--time-format=ISO6081_WITH_TIME']
        if (options.usePcre) args.push('--use-pcre')

        await this.run('mega-ls', {
            args: args,
            consoleLogGeneralOptions: { verbosity: LogLevel.NONE }
        })
        const outputStr = this.getCmdOutput()
        if (outputStr.indexOf("Couldn't find") !== -1) return result

        const lines = outputStr.split("\n")
        if (!isHeaderValid(lines)) {
            const err = 'Unrecognized header in mega-ls'
            this.consoleLog.error(err)
            result.state = 'error'
            result.error = err
            return result
        }

        const files = [] as MegaCmdFile[]
        for (const line of lines) {
            if (!line) continue
            const match = line.match(/([\S]{4})\s+(\d+|-)\s+(\d+|-)\s+([\S]{19})\s+(.+)/)
            if (!match) {
                const err = `Unable to parse mega-ls line: ${line}`
                this.consoleLog.error(err)
                result.state = 'error'
                result.error = err
                return result
            }

            const flags = match[1]
            const versions = parseInt(match[2]) !== 0 ? parseInt(match[2]) : 0
            const bytes = parseInt(match[3]) !== 0 ? parseInt(match[3]) : 0
            const time = match[4]
            const name = match[5]

            const isDir = isDirectory(flags)
            if (isDir === null) return result

            const fullPath = remotepath ? remotepath + (name ? '/' + name : '') : name
            const el:MegaCmdFile = {
                name: name,
                path: fullPath,
                type: 'file',
                updatedAt: time
            }

            if (versions > 1) el.versions = versions
            if (bytes > 0) el.bytes = bytes

            if (isDirectory(flags)) {
                el.type = 'directory'
                if (options.recursive) {
                    const childResult = await this.ls(fullPath, inputOptions)
                    if (childResult.state === 'error') {
                        result.state = 'error'
                        result.error = childResult.error
                        return result
                    }
                    const child = childResult.file as MegaCmdFile
                    const childrenBytes = getBytesByChildren(child)
                    if (childrenBytes === false) {
                        const err = `Unable to determinate bytes for directory "${ el.name }"`
                        this.consoleLog.warn(err)
                        result.error = err
                        result.state = 'error'
                        return result
                    }
                        else el.bytes = childrenBytes
                    el.children = child.children
                }
            }

            files.push(el)
        }

        if (files.length === 1 && files[0].type === 'file') result.file = files[0]
        else {
            const dir:MegaCmdFile = {
                name: MegaCmd.getNameFromPath(remotepath),
                path: remotepath,
                type: 'directory',
                children: files
            }
            const bytes = getBytesByChildren(dir)
            if (bytes) dir.bytes = bytes

            result.file = dir
        }

        return result
    }

    async put(localpath:string | string[], remotepath = '', inputOptions?:Partial<MegaPutOptions>) {
        const options:Partial<MegaPutOptions> = _.defaults(inputOptions, {
            args: [],
            createRemoteFolder: false,
            getResult: false,
            timeout: 2 * 3600
        })
        
        const args = []
        if (options.createRemoteFolder) args.push('-c')
        if (typeof localpath !== 'string') localpath.map( p => args.push(p) )
            else args.push(localpath)
        if (remotepath) args.push(remotepath)
        options.args = args
 
        const cmd = new Cmd('mega-put', options)
        await this.transfer(cmd)
        return cmd.exitCode === 0
    }

    async get(remotepath:string, localpath = '', inputOptions?:Partial<MegaGetOptions>) {
        const options:MegaGetOptions = _.defaults(inputOptions, {
            args: [],
            usePcre: false,
            merge: false,
            getResult: false,
            timeout: 2 * 3600,
            consoleLogGeneralOptions: {}
        })

        const args = []
        if (options.merge) args.push('--use-pcre')
        if (options.usePcre) args.push('--use-pcre')
        args.push(remotepath)
        if (localpath) args.push(localpath)
        options.args = args

        const cmd = new Cmd('mega-get', options)
        await this.transfer(cmd, options.onTransfer)
        return cmd.exitCode === 0
    }

    private async transfer(cmd:Cmd, onTransfer?:EventEmitter) {
        const mega = this
        cmd.consoleLog = this.consoleLog.spawn()
        cmd.stderr.logLevel = LogLevel.DEBUG

        function transferringParser(text:string) {
            const parsed = text.match(/\((\d+)\/(\d+)\s+([^:]+):\s+([0-9.]+)\s+%\)/)
            if (!parsed) {
                mega.consoleLog.warn(`transferring parsing error: ${text}`)
                return null
            }

            let unit = 1
            switch(parsed[3]) {
                case 'KB':
                    unit = 1000
                    break
                case 'MB':
                    unit = 1000000
                    break
                default:
                mega.consoleLog.warn(`transferring parsing unit unknown: ${ parsed[3] }`)
                return null
            }

            return {
                bytes: parseInt(parsed[1]) * unit,
                totalBytes: parseInt(parsed[2]) * unit,
                percentage: parseFloat(parsed[4])
            }
        }

        function listener(data:Error | Buffer) {
            if (Buffer.isBuffer(data)) {
                const text = data.toString()
                if (text.indexOf('TRANSFERRING') !== -1) {
                    const info = transferringParser(text)
                    if (info) onTransfer!.emit('progress', info)
                }
            }
        }

        if (onTransfer) cmd.stderr.addListener('data', listener)
        await cmd.run()
        if (onTransfer) cmd.stderr.removeListener('data', listener)
    }

    async rm(remotepath:string, inputOptions?:Partial<MegaRmOptions>) {
        const options:MegaRmOptions = _.defaults(inputOptions, {
            usePcre: false,
            recursive: false,
            getResult: false,
        })

        const args = ['-f']
        if (options.recursive) args.push('-r')
        if (options.usePcre) args.push('--use-pcre')
        args.push(remotepath)

        const cmd = await this.run('mega-rm', { args: args })
        return cmd.exitCode === 0
    }

    static async isIdle() {
        if (this.lockedBy || this.started === null) return false
        if (this.started === false) await this.startup()
        const isOnline = await Network.get().hasInternetAccess()

        return isOnline
    }

    static async getProxy() {
        const mega = new MegaCmd()
        const output = (await mega.run('mega-proxy')).stdout.data
        if (output.indexOf('Proxy disabled') !== -1) return null

        const lines = output.split("\n")
        let type = ''
        let url = ''
        for (const line of lines) {
            const typeMatch = line.match(/Type = ([^\s]+)/)
            if (typeMatch) type = typeMatch[1]
            const urlMatch = line.match(/URL = ([^\s]+)/)
            if (urlMatch) url = urlMatch[1]
        }
        if (!type || (type === 'CUSTOM' && !url)) throw new Error(`unable to parse properly mega proxy: ${output}`)
        return {
            type: type,
            url: url
        }
    }

    static async setProxy(type:'none' | 'auto' | string) {
        const mega = new MegaCmd()
        let typeStr = type
        if (type === 'none') typeStr = '--none'
        if (type === 'auto') typeStr = '--auto'
        await mega.run('mega-proxy', {
            getResult: false,
            args: [typeStr]
        })

        const proxyInfo = await this.getProxy()
        if (!proxyInfo && type === 'none') return
        if (type === 'auto' && proxyInfo!.type === "AUTO") return
        if (proxyInfo!.type === "CUSTOM") return
        throw new Error('unable to properly set proxy')
    }

    static async startup() {
        if (this.started) return true
        if (this.started === null) return false
        this.started = null
        const mega = new MegaCmd()
        mega.consoleLog.print('waiting for Mega Server startup...')
        try {
            await mega.run('mega-help', {
                timeout: 30,
                getResult: false,
                consoleLogGeneralOptions: { verbosity: LogLevel.NONE }
            })
            mega.consoleLog.print('Mega Server ready')
            this.started = true
            return true
        } catch (e) {
            const message = `${e}`
            if (message.indexOf('ENOENT') !== -1) mega.consoleLog.error('mega-help not found, probably mega not installed!')
                else mega.consoleLog.warn(message)
            return false
        }
    }

    static async get(lockedBy?:string) {
        if (this.started === null) return null // startup running
        if (!this.started) await this.startup()

        const isIdle = await this.isIdle()
        if (!isIdle) return null

        if (!lockedBy) lockedBy = 'unknown'
        this.lockedBy = lockedBy

        this.consoleLog.debug(`${ lockedBy } locked`)
        const mega = new MegaCmd()
        return mega
    }

    static unlock(lockedBy:string) {
        if (!this.lockedBy) {
            this.consoleLog.warn('already unlocked')
            return true
        }
        if (lockedBy !== this.lockedBy) {
            this.consoleLog.warn(`wrong lockingSecret ${ this.lockedBy } != ${ lockedBy }`)
            return false
        }
        
        this.consoleLog.debug(`${ lockedBy } unlocked`)
        this.lockedBy = ''
        this.onIdle.fire()
        return true
    }

    static getOrWait(lockedBy?:string, timeoutInSeconds = 3600) {
        return new Promise<MegaCmd | null>( async (resolve) => {
            const startedAt = (new Date()).getTime()
            let resolved = false
            let megaCmd = await this.get(lockedBy)
            let timeoutFunction = null as NodeJS.Timeout | null
            if (megaCmd) {
                resolve(megaCmd)
                return
            }
            const network = Network.get()
            const hasInternetAccess = await network.hasInternetAccess()
            const onlineAgain = async () => {
                if (resolved) return
                this.consoleLog.debug(`${ lockedBy } getOrWait online again...`)
                setResolved()
            }
            const setResolved = () => {
                resolved = true
                const timeSpent = ((new Date()).getTime() - startedAt) / 1000
                if (timeoutFunction) clearTimeout(timeoutFunction)
                network.off('online', onlineAgain)
                resolve( this.getOrWait(lockedBy, timeoutInSeconds ? timeoutInSeconds - timeSpent : 0) )
            }

            if (!hasInternetAccess) network.once('online', onlineAgain)

            if (timeoutInSeconds) {
                timeoutFunction = setTimeout( () => {
                    if (resolved) return
                    network.off('online', onlineAgain)
                    resolved = true
                    this.consoleLog.debug(`${ lockedBy } getOrWait timeout triggered`)
                    resolve(null)
                }, timeoutInSeconds * 1000)
            }

            this.onIdle.add( () => {
                if (resolved) return
                this.consoleLog.debug(`${ lockedBy } getOrWait unlocked triggered`)
                setResolved()
            })
        })
    }

    static getNameFromPath(path:string) {
        const lastSlash = path.lastIndexOf('/')
        return lastSlash !== -1 ? path.substring(lastSlash + 1) : ''
    }
}