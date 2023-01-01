"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var cmd_1 = __importDefault(require("@winkgroup/cmd"));
var console_log_1 = __importStar(require("@winkgroup/console-log"));
var event_queue_1 = __importDefault(require("@winkgroup/event-queue"));
var misc_1 = require("@winkgroup/misc");
var network_1 = __importDefault(require("@winkgroup/network"));
var lodash_1 = __importDefault(require("lodash"));
var common_1 = require("./common");
var MegaCmd = /** @class */ (function () {
    function MegaCmd(inputOptions) {
        this.runningCmd = null;
        var options = lodash_1.default.defaults(inputOptions, {
            consoleLog: MegaCmd.consoleLog.spawn()
        });
        this.consoleLog = options.consoleLog;
    }
    MegaCmd.getLockedBy = function () { return this.lockedBy; };
    MegaCmd.prototype.run = function (cmd, inputCmdOptions) {
        return __awaiter(this, void 0, void 0, function () {
            var cmdOptions, cmdObj;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cmdOptions = lodash_1.default.defaults(inputCmdOptions, { stderrOptions: { logLevel: console_log_1.LogLevel.DEBUG } });
                        this.runningCmd = new cmd_1.default(cmd, cmdOptions);
                        return [4 /*yield*/, this.runningCmd.run()];
                    case 1:
                        cmdObj = _a.sent();
                        return [2 /*return*/, cmdObj];
                }
            });
        });
    };
    MegaCmd.prototype.getCmdOutput = function (stream) {
        if (stream === void 0) { stream = 'stdout'; }
        var cmd = this.runningCmd;
        return stream === 'stdout' ? cmd.stdout.data : cmd.stderr.data;
    };
    MegaCmd.prototype.whoAmI = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.run('mega-whoami', { consoleLogGeneralOptions: { verbosity: console_log_1.LogLevel.NONE } })];
                    case 1:
                        _a.sent();
                        result = this.getCmdOutput();
                        if (result.indexOf('Not logged in') !== -1)
                            return [2 /*return*/, null];
                        result = result.substring('Account e-mail: '.length).trim();
                        if (result && !result.match(/^\w+([\.\+-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
                            message = "\"".concat(this.getCmdOutput(), "\" has no valid email");
                            this.consoleLog.error("whoAmI ".concat(message));
                            throw new Error(message);
                        }
                        return [2 /*return*/, result ? result : null];
                }
            });
        });
    };
    MegaCmd.prototype.login = function (email, password) {
        return __awaiter(this, void 0, void 0, function () {
            var currentEmail, cmd, newEmail;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.whoAmI()];
                    case 1:
                        currentEmail = _a.sent();
                        if (currentEmail === email)
                            return [2 /*return*/, true];
                        if (!currentEmail) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.logout()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.run('mega-login', {
                            args: [email, password],
                            consoleLogGeneralOptions: { verbosity: console_log_1.LogLevel.NONE }
                        })];
                    case 4:
                        cmd = _a.sent();
                        return [4 /*yield*/, this.whoAmI()];
                    case 5:
                        newEmail = _a.sent();
                        if (newEmail === email) {
                            this.consoleLog.print("logged as ".concat(email));
                            this.consoleLog.generalOptions.id = email;
                            return [2 /*return*/, true];
                        }
                        else {
                            this.consoleLog.warn("unable to login as ".concat(email));
                            this.consoleLog.debug(cmd.stderr.data);
                            return [2 /*return*/, false];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    MegaCmd.prototype.logout = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.run('mega-logout', { getResult: false })];
                    case 1:
                        _a.sent();
                        delete this.consoleLog.generalOptions.id;
                        return [2 /*return*/];
                }
            });
        });
    };
    MegaCmd.prototype.df = function () {
        return __awaiter(this, void 0, void 0, function () {
            function parsingError(line) {
                ref.consoleLog.warn("Unable to parse df result at line ".concat(line));
                return false;
            }
            function setDataFromUsedStorageLine(line) {
                var matches = line.match(/USED STORAGE:\s+(\d+)\s+([^\s]+) of (\d+)/);
                if (!matches)
                    return parsingError(line);
                usedBytes = parseInt(matches[1]);
                totalBytes = parseInt(matches[3]);
                return true;
            }
            function setDataFromFileVersionsLine(line) {
                var matches = line.match(/Total size taken up by file versions:\s+(\d+)/);
                if (!matches)
                    return parsingError(line);
                fileVersionsBytes = parseInt(matches[1]);
                return true;
            }
            function setDataFromGeneralLine(line) {
                var matches = line.match(/(.+):\s+(\d+) in\s+(\d+) file\(s\) and\s+(\d+) folder\(s\)/);
                if (!matches)
                    return parsingError(line);
                var result = {
                    bytes: parseInt(matches[2]),
                    numOfFiles: parseInt(matches[3]),
                    numOfFolders: parseInt(matches[4])
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
                    default: return parsingError(line);
                }
                return true;
            }
            var output, usedBytes, totalBytes, fileVersionsBytes, drive, inbox, trash, ref, sections, lines, _i, lines_1, line, parsingResult, _a, sections_1, section, freeBytes, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        output = '';
                        usedBytes = 0;
                        totalBytes = 0;
                        fileVersionsBytes = 0;
                        ref = this;
                        sections = ['Cloud drive:', 'Inbox:', 'Rubbish bin:'];
                        return [4 /*yield*/, this.run('mega-df', { consoleLogGeneralOptions: { verbosity: console_log_1.LogLevel.NONE } })];
                    case 1:
                        _b.sent();
                        output = this.getCmdOutput();
                        lines = output.split("\n");
                        for (_i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                            line = lines_1[_i];
                            parsingResult = true;
                            if (line.indexOf('USED STORAGE:') !== -1)
                                parsingResult = setDataFromUsedStorageLine(line);
                            if (line.indexOf('Total size taken up by file versions:') !== -1)
                                parsingResult = setDataFromFileVersionsLine(line);
                            for (_a = 0, sections_1 = sections; _a < sections_1.length; _a++) {
                                section = sections_1[_a];
                                if (line.indexOf(section) !== -1)
                                    parsingResult = setDataFromGeneralLine(line);
                            }
                            if (!parsingResult)
                                return [2 /*return*/, false]; // parsing error
                        }
                        freeBytes = totalBytes - usedBytes;
                        result = {
                            trash: trash,
                            drive: drive,
                            inbox: inbox,
                            freeBytes: freeBytes,
                            totalBytes: totalBytes,
                            fileVersionsBytes: fileVersionsBytes
                        };
                        this.consoleLog.print("df -> ".concat((0, misc_1.byteString)(freeBytes), " / ").concat((0, misc_1.byteString)(totalBytes)));
                        return [2 /*return*/, result];
                }
            });
        });
    };
    MegaCmd.prototype.ls = function (remotepath, inputOptions) {
        if (remotepath === void 0) { remotepath = ''; }
        return __awaiter(this, void 0, void 0, function () {
            function isHeaderValid(lines) {
                var header1 = lines.shift();
                if (!header1)
                    return false;
                if (header1.substring(0, 5) === 'FLAGS')
                    return true;
                var header2 = lines.shift();
                if (!header2)
                    return false;
                return header2.substring(0, 5) === 'FLAGS';
            }
            function isDirectory(flags) {
                var firstFlag = flags[0];
                switch (firstFlag) {
                    case 'd': return true;
                    case '-': return false;
                    default:
                        var err = "Unable to parse flags in mega-ls: ".concat(flags);
                        ref.consoleLog.error(err);
                        result.state = 'error';
                        result.error = err;
                }
                return null;
            }
            var ref, options, result, args, outputStr, lines, err, files, _i, lines_2, line, match, err, flags, versions, bytes, time, name_1, isDir, fullPath, el, childResult, child, childrenBytes, err, dir, bytes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ref = this;
                        options = lodash_1.default.defaults(inputOptions, {
                            usePcre: false,
                            recursive: false
                        });
                        result = {
                            state: 'success'
                        };
                        args = [remotepath, '-l', '--time-format=ISO6081_WITH_TIME'];
                        if (options.usePcre)
                            args.push('--use-pcre');
                        return [4 /*yield*/, this.run('mega-ls', {
                                args: args,
                                consoleLogGeneralOptions: { verbosity: console_log_1.LogLevel.NONE }
                            })];
                    case 1:
                        _a.sent();
                        outputStr = this.getCmdOutput();
                        if (outputStr.indexOf("Couldn't find") !== -1)
                            return [2 /*return*/, result];
                        lines = outputStr.split("\n");
                        if (!isHeaderValid(lines)) {
                            err = 'Unrecognized header in mega-ls';
                            this.consoleLog.error(err);
                            result.state = 'error';
                            result.error = err;
                            return [2 /*return*/, result];
                        }
                        files = [];
                        _i = 0, lines_2 = lines;
                        _a.label = 2;
                    case 2:
                        if (!(_i < lines_2.length)) return [3 /*break*/, 6];
                        line = lines_2[_i];
                        if (!line)
                            return [3 /*break*/, 5];
                        match = line.match(/([\S]{4})\s+(\d+|-)\s+(\d+|-)\s+([\S]{19})\s+(.+)/);
                        if (!match) {
                            err = "Unable to parse mega-ls line: ".concat(line);
                            this.consoleLog.error(err);
                            result.state = 'error';
                            result.error = err;
                            return [2 /*return*/, result];
                        }
                        flags = match[1];
                        versions = parseInt(match[2]) !== 0 ? parseInt(match[2]) : 0;
                        bytes = parseInt(match[3]) !== 0 ? parseInt(match[3]) : 0;
                        time = match[4];
                        name_1 = match[5];
                        isDir = isDirectory(flags);
                        if (isDir === null)
                            return [2 /*return*/, result];
                        fullPath = remotepath ? remotepath + (name_1 ? '/' + name_1 : '') : name_1;
                        el = {
                            name: name_1,
                            path: fullPath,
                            type: 'file',
                            updatedAt: time
                        };
                        if (versions > 1)
                            el.versions = versions;
                        if (bytes > 0)
                            el.bytes = bytes;
                        if (!isDirectory(flags)) return [3 /*break*/, 4];
                        el.type = 'directory';
                        if (!options.recursive) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.ls(fullPath, inputOptions)];
                    case 3:
                        childResult = _a.sent();
                        if (childResult.state === 'error') {
                            result.state = 'error';
                            result.error = childResult.error;
                            return [2 /*return*/, result];
                        }
                        child = childResult.file;
                        childrenBytes = (0, common_1.getBytesByChildren)(child);
                        if (childrenBytes === false) {
                            err = "Unable to determinate bytes for directory \"".concat(el.name, "\"");
                            this.consoleLog.warn(err);
                            result.error = err;
                            result.state = 'error';
                            return [2 /*return*/, result];
                        }
                        else
                            el.bytes = childrenBytes;
                        el.children = child.children;
                        _a.label = 4;
                    case 4:
                        files.push(el);
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 2];
                    case 6:
                        if (files.length === 1 && files[0].type === 'file')
                            result.file = files[0];
                        else {
                            dir = {
                                name: MegaCmd.getNameFromPath(remotepath),
                                path: remotepath,
                                type: 'directory',
                                children: files
                            };
                            bytes = (0, common_1.getBytesByChildren)(dir);
                            if (bytes)
                                dir.bytes = bytes;
                            result.file = dir;
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    MegaCmd.prototype.put = function (localpath, remotepath, inputOptions) {
        if (remotepath === void 0) { remotepath = ''; }
        return __awaiter(this, void 0, void 0, function () {
            var options, args, cmd;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options = lodash_1.default.defaults(inputOptions, {
                            args: [],
                            createRemoteFolder: false,
                            getResult: false,
                            timeout: 2 * 3600
                        });
                        args = [];
                        if (options.createRemoteFolder)
                            args.push('-c');
                        if (typeof localpath !== 'string')
                            localpath.map(function (p) { return args.push(p); });
                        else
                            args.push(localpath);
                        if (remotepath)
                            args.push(remotepath);
                        options.args = args;
                        cmd = new cmd_1.default('mega-put', options);
                        return [4 /*yield*/, this.transfer(cmd)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, cmd.exitCode === 0];
                }
            });
        });
    };
    MegaCmd.prototype.get = function (remotepath, localpath, inputOptions) {
        if (localpath === void 0) { localpath = ''; }
        return __awaiter(this, void 0, void 0, function () {
            var options, args, cmd;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options = lodash_1.default.defaults(inputOptions, {
                            args: [],
                            usePcre: false,
                            merge: false,
                            getResult: false,
                            timeout: 2 * 3600,
                            consoleLogGeneralOptions: {}
                        });
                        args = [];
                        if (options.merge)
                            args.push('--use-pcre');
                        if (options.usePcre)
                            args.push('--use-pcre');
                        args.push(remotepath);
                        if (localpath)
                            args.push(localpath);
                        options.args = args;
                        cmd = new cmd_1.default('mega-get', options);
                        return [4 /*yield*/, this.transfer(cmd, options.onTransfer)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, cmd.exitCode === 0];
                }
            });
        });
    };
    MegaCmd.prototype.transfer = function (cmd, onTransfer) {
        return __awaiter(this, void 0, void 0, function () {
            function transferringParser(text) {
                var parsed = text.match(/\((\d+)\/(\d+)\s+([^:]+):\s+([0-9.]+)\s+%\)/);
                if (!parsed) {
                    mega.consoleLog.warn("transferring parsing error: ".concat(text));
                    return null;
                }
                var unit = 1;
                switch (parsed[3]) {
                    case 'KB':
                        unit = 1000;
                        break;
                    case 'MB':
                        unit = 1000000;
                        break;
                    default:
                        mega.consoleLog.warn("transferring parsing unit unknown: ".concat(parsed[3]));
                        return null;
                }
                return {
                    bytes: parseInt(parsed[1]) * unit,
                    totalBytes: parseInt(parsed[2]) * unit,
                    percentage: parseFloat(parsed[4])
                };
            }
            function listener(data) {
                if (Buffer.isBuffer(data)) {
                    var text = data.toString();
                    if (text.indexOf('TRANSFERRING') !== -1) {
                        var info = transferringParser(text);
                        if (info)
                            onTransfer.emit('progress', info);
                    }
                }
            }
            var mega;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mega = this;
                        cmd.consoleLog = this.consoleLog.spawn();
                        cmd.stderr.logLevel = console_log_1.LogLevel.DEBUG;
                        if (onTransfer)
                            cmd.stderr.addListener('data', listener);
                        return [4 /*yield*/, cmd.run()];
                    case 1:
                        _a.sent();
                        if (onTransfer)
                            cmd.stderr.removeListener('data', listener);
                        return [2 /*return*/];
                }
            });
        });
    };
    MegaCmd.prototype.rm = function (remotepath, inputOptions) {
        return __awaiter(this, void 0, void 0, function () {
            var options, args, cmd;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options = lodash_1.default.defaults(inputOptions, {
                            usePcre: false,
                            recursive: false,
                            getResult: false,
                        });
                        args = ['-f'];
                        if (options.recursive)
                            args.push('-r');
                        if (options.usePcre)
                            args.push('--use-pcre');
                        args.push(remotepath);
                        return [4 /*yield*/, this.run('mega-rm', { args: args })];
                    case 1:
                        cmd = _a.sent();
                        return [2 /*return*/, cmd.exitCode === 0];
                }
            });
        });
    };
    MegaCmd.isIdle = function () {
        return __awaiter(this, void 0, void 0, function () {
            var isOnline;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.lockedBy || this.started === null)
                            return [2 /*return*/, false];
                        if (!(this.started === false)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.startup()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, network_1.default.get().hasInternetAccess()];
                    case 3:
                        isOnline = _a.sent();
                        return [2 /*return*/, isOnline];
                }
            });
        });
    };
    MegaCmd.getProxy = function () {
        return __awaiter(this, void 0, void 0, function () {
            var mega, output, lines, type, url, _i, lines_3, line, typeMatch, urlMatch;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mega = new MegaCmd();
                        return [4 /*yield*/, mega.run('mega-proxy')];
                    case 1:
                        output = (_a.sent()).stdout.data;
                        if (output.indexOf('Proxy disabled') !== -1)
                            return [2 /*return*/, null];
                        lines = output.split("\n");
                        type = '';
                        url = '';
                        for (_i = 0, lines_3 = lines; _i < lines_3.length; _i++) {
                            line = lines_3[_i];
                            typeMatch = line.match(/Type = ([^\s]+)/);
                            if (typeMatch)
                                type = typeMatch[1];
                            urlMatch = line.match(/URL = ([^\s]+)/);
                            if (urlMatch)
                                url = urlMatch[1];
                        }
                        if (!type || (type === 'CUSTOM' && !url))
                            throw new Error("unable to parse properly mega proxy: ".concat(output));
                        return [2 /*return*/, {
                                type: type,
                                url: url
                            }];
                }
            });
        });
    };
    MegaCmd.setProxy = function (type) {
        return __awaiter(this, void 0, void 0, function () {
            var mega, typeStr, proxyInfo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mega = new MegaCmd();
                        typeStr = type;
                        if (type === 'none')
                            typeStr = '--none';
                        if (type === 'auto')
                            typeStr = '--auto';
                        return [4 /*yield*/, mega.run('mega-proxy', {
                                getResult: false,
                                args: [typeStr]
                            })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.getProxy()];
                    case 2:
                        proxyInfo = _a.sent();
                        if (!proxyInfo && type === 'none')
                            return [2 /*return*/];
                        if (type === 'auto' && proxyInfo.type === "AUTO")
                            return [2 /*return*/];
                        if (proxyInfo.type === "CUSTOM")
                            return [2 /*return*/];
                        throw new Error('unable to properly set proxy');
                }
            });
        });
    };
    MegaCmd.startup = function () {
        return __awaiter(this, void 0, void 0, function () {
            var mega, e_1, message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.started)
                            return [2 /*return*/, true];
                        if (this.started === null)
                            return [2 /*return*/, false];
                        this.started = null;
                        mega = new MegaCmd();
                        mega.consoleLog.print('waiting for Mega Server startup...');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, mega.run('mega-help', {
                                timeout: 30,
                                getResult: false,
                                consoleLogGeneralOptions: { verbosity: console_log_1.LogLevel.NONE }
                            })];
                    case 2:
                        _a.sent();
                        mega.consoleLog.print('Mega Server ready');
                        this.started = true;
                        return [2 /*return*/, true];
                    case 3:
                        e_1 = _a.sent();
                        message = "".concat(e_1);
                        if (message.indexOf('ENOENT') !== -1)
                            mega.consoleLog.error('mega-help not found, probably mega not installed!');
                        else
                            mega.consoleLog.warn(message);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    MegaCmd.get = function (lockedBy) {
        return __awaiter(this, void 0, void 0, function () {
            var isIdle, mega;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.started === null)
                            return [2 /*return*/, null]; // startup running
                        if (!!this.started) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.startup()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.isIdle()];
                    case 3:
                        isIdle = _a.sent();
                        if (!isIdle)
                            return [2 /*return*/, null];
                        if (!lockedBy)
                            lockedBy = 'unknown';
                        this.lockedBy = lockedBy;
                        this.consoleLog.debug("".concat(lockedBy, " locked"));
                        mega = new MegaCmd();
                        return [2 /*return*/, mega];
                }
            });
        });
    };
    MegaCmd.unlock = function (lockedBy) {
        if (!this.lockedBy) {
            this.consoleLog.warn('already unlocked');
            return true;
        }
        if (lockedBy !== this.lockedBy) {
            this.consoleLog.warn("wrong lockingSecret ".concat(this.lockedBy, " != ").concat(lockedBy));
            return false;
        }
        this.consoleLog.debug("".concat(lockedBy, " unlocked"));
        this.lockedBy = '';
        this.onIdle.fire();
        return true;
    };
    MegaCmd.getOrWait = function (lockedBy, timeoutInSeconds) {
        var _this = this;
        if (timeoutInSeconds === void 0) { timeoutInSeconds = 3600; }
        return new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
            var startedAt, resolved, megaCmd, timeoutFunction, network, hasInternetAccess, onlineAgain, setResolved;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startedAt = (new Date()).getTime();
                        resolved = false;
                        return [4 /*yield*/, this.get(lockedBy)];
                    case 1:
                        megaCmd = _a.sent();
                        timeoutFunction = null;
                        if (megaCmd) {
                            resolve(megaCmd);
                            return [2 /*return*/];
                        }
                        network = network_1.default.get();
                        return [4 /*yield*/, network.hasInternetAccess()];
                    case 2:
                        hasInternetAccess = _a.sent();
                        onlineAgain = function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                if (resolved)
                                    return [2 /*return*/];
                                this.consoleLog.debug("".concat(lockedBy, " getOrWait online again..."));
                                setResolved();
                                return [2 /*return*/];
                            });
                        }); };
                        setResolved = function () {
                            resolved = true;
                            var timeSpent = ((new Date()).getTime() - startedAt) / 1000;
                            if (timeoutFunction)
                                clearTimeout(timeoutFunction);
                            network.off('online', onlineAgain);
                            resolve(_this.getOrWait(lockedBy, timeoutInSeconds ? timeoutInSeconds - timeSpent : 0));
                        };
                        if (!hasInternetAccess)
                            network.once('online', onlineAgain);
                        if (timeoutInSeconds) {
                            timeoutFunction = setTimeout(function () {
                                if (resolved)
                                    return;
                                network.off('online', onlineAgain);
                                resolved = true;
                                _this.consoleLog.debug("".concat(lockedBy, " getOrWait timeout triggered"));
                                resolve(null);
                            }, timeoutInSeconds * 1000);
                        }
                        this.onIdle.add(function () {
                            if (resolved)
                                return;
                            _this.consoleLog.debug("".concat(lockedBy, " getOrWait unlocked triggered"));
                            setResolved();
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    };
    MegaCmd.getNameFromPath = function (path) {
        var lastSlash = path.lastIndexOf('/');
        return lastSlash !== -1 ? path.substring(lastSlash + 1) : '';
    };
    MegaCmd.started = false;
    MegaCmd.lockedBy = '';
    MegaCmd.onIdle = new event_queue_1.default();
    MegaCmd.consoleLog = new console_log_1.default({ prefix: 'MegaCmd' });
    return MegaCmd;
}());
exports.default = MegaCmd;
