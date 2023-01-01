"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var console_log_1 = __importDefault(require("@winkgroup/console-log"));
var misc_1 = require("@winkgroup/misc");
var lodash_1 = __importDefault(require("lodash"));
var _1 = __importDefault(require("."));
var StorageMega = /** @class */ (function () {
    function StorageMega(input) {
        this.email = input.email;
        this.password = input.password;
        this.timeoutInSecondsToGetMegaCmd = input.timeoutInSecondsToGetMegaCmd;
        this.consoleLog = input.consoleLog ? input.consoleLog : new console_log_1.default({ prefix: 'StorageMega' });
    }
    StorageMega.prototype.getMegaCmdAndLogin = function (inputMega, lockingString) {
        if (inputMega === void 0) { inputMega = null; }
        return __awaiter(this, void 0, void 0, function () {
            var megaCmd;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        megaCmd = inputMega;
                        if (!!megaCmd) return [3 /*break*/, 5];
                        if (!(typeof this.timeoutInSecondsToGetMegaCmd !== 'undefined')) return [3 /*break*/, 2];
                        return [4 /*yield*/, _1.default.getOrWait(lockingString, this.timeoutInSecondsToGetMegaCmd)];
                    case 1:
                        megaCmd = _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, _1.default.get(lockingString)];
                    case 3:
                        megaCmd = _a.sent();
                        _a.label = 4;
                    case 4:
                        if (!megaCmd) {
                            if (this.timeoutInSecondsToGetMegaCmd !== 0)
                                this.consoleLog.warn("timeout or fail in getOrWait with lockingString \"".concat(lockingString, "\""));
                            else
                                this.consoleLog.debug("megaCmd not available for lockingString \"".concat(lockingString, "\""));
                            return [2 /*return*/, null];
                        }
                        _a.label = 5;
                    case 5: return [4 /*yield*/, megaCmd.login(this.email, this.password)];
                    case 6:
                        if (!(_a.sent())) {
                            this.consoleLog.warn("unable to login with lockingString \"".concat(lockingString, "\""));
                            if (!inputMega && _1.default.getLockedBy() === lockingString)
                                _1.default.unlock(lockingString);
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, megaCmd];
                }
            });
        });
    };
    StorageMega.prototype.df = function (inputOptions) {
        return __awaiter(this, void 0, void 0, function () {
            var options, lockingString, megaCmd, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options = lodash_1.default.defaults(inputOptions, { noLogs: false });
                        lockingString = "storage ".concat(this.email, " df");
                        return [4 /*yield*/, this.getMegaCmdAndLogin(options.megaCmd, lockingString)];
                    case 1:
                        megaCmd = _a.sent();
                        if (!megaCmd)
                            return [2 /*return*/, false];
                        return [4 /*yield*/, megaCmd.df()];
                    case 2:
                        result = _a.sent();
                        if (result && !options.noLogs)
                            this.consoleLog.print("free bytes: ".concat((0, misc_1.byteString)(result.freeBytes), " / ").concat((0, misc_1.byteString)(result.totalBytes)));
                        if (!options.megaCmd)
                            _1.default.unlock(lockingString);
                        return [2 /*return*/, result];
                }
            });
        });
    };
    StorageMega.prototype.getPathType = function (path, inputMegaCmd) {
        if (inputMegaCmd === void 0) { inputMegaCmd = null; }
        return __awaiter(this, void 0, void 0, function () {
            var lockingString, megaCmd, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        lockingString = "storage ".concat(this.email, " getPathType");
                        return [4 /*yield*/, this.getMegaCmdAndLogin(inputMegaCmd, lockingString)];
                    case 1:
                        megaCmd = _a.sent();
                        if (!megaCmd)
                            return [2 /*return*/, false];
                        return [4 /*yield*/, megaCmd.ls(path)];
                    case 2:
                        result = _a.sent();
                        if (!inputMegaCmd)
                            _1.default.unlock(lockingString);
                        if (result.state === 'error')
                            return [2 /*return*/, false];
                        if (!result.file)
                            return [2 /*return*/, 'none'];
                        return [2 /*return*/, result.file.type];
                }
            });
        });
    };
    StorageMega.prototype.ls = function (remotepath, inputOptions) {
        if (remotepath === void 0) { remotepath = ''; }
        return __awaiter(this, void 0, void 0, function () {
            var options, lockingString, megaCmd, result_1, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options = lodash_1.default.defaults(inputOptions, {});
                        lockingString = "storage ".concat(this.email, " ls");
                        return [4 /*yield*/, this.getMegaCmdAndLogin(options.megaCmd, lockingString)];
                    case 1:
                        megaCmd = _a.sent();
                        if (!megaCmd) {
                            result_1 = { state: 'error', error: 'unable to get megaCmd' };
                            return [2 /*return*/, result_1];
                        }
                        return [4 /*yield*/, megaCmd.ls(remotepath, inputOptions)];
                    case 2:
                        result = _a.sent();
                        if (!options.megaCmd)
                            _1.default.unlock(lockingString);
                        return [2 /*return*/, result];
                }
            });
        });
    };
    StorageMega.prototype.isFileOk = function (remotepath, inputOptions) {
        return __awaiter(this, void 0, void 0, function () {
            var options, lockingString, megaCmd, lsResult, result, byteDiff;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options = lodash_1.default.defaults(inputOptions, { toleranceBytesPercentage: .05 });
                        lockingString = "storage ".concat(this.email, " isFileOk");
                        return [4 /*yield*/, this.getMegaCmdAndLogin(options.megaCmd, lockingString)];
                    case 1:
                        megaCmd = _a.sent();
                        if (!megaCmd)
                            return [2 /*return*/, { error: 'unable to check' }];
                        return [4 /*yield*/, this.ls(remotepath, { megaCmd: options.megaCmd })];
                    case 2:
                        lsResult = _a.sent();
                        if (!options.megaCmd)
                            _1.default.unlock(lockingString);
                        if (lsResult.state == 'error')
                            return [2 /*return*/, { error: 'unable to check' }];
                        if (!lsResult.file)
                            return [2 /*return*/, { error: 'file not found' }];
                        result = { file: lsResult.file };
                        delete result.file.children;
                        if (options.expectedBytes) {
                            if (!result.file.bytes)
                                return [2 /*return*/, __assign(__assign({}, result), { error: 'no bytes in file' })];
                            byteDiff = Math.abs(result.file.bytes - options.expectedBytes) / options.expectedBytes;
                            if (byteDiff > options.toleranceBytesPercentage)
                                return [2 /*return*/, __assign(__assign({}, result), { error: 'file size too different' })];
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    StorageMega.prototype.upload = function (localpath, remotepath, inputOptions) {
        if (remotepath === void 0) { remotepath = ''; }
        return __awaiter(this, void 0, void 0, function () {
            function setError(obj, message, unlock) {
                if (unlock === void 0) { unlock = true; }
                obj.state = 'error';
                obj.error = message;
                if (!options.megaCmd && unlock)
                    _1.default.unlock(lockingString);
                return obj;
            }
            var lockingString, options, megaCmd, bytesToUpload, result, remotePathType, localFilePaths, _i, localFilePaths_1, localFilePath, localName, remotePath, remoteName, fileCheck, stats, remoteFileType, dfResult, cmdResult, _a, _b, fileTransferResult, localBytes, isFileOk;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        lockingString = "storage ".concat(this.email, " upload");
                        options = lodash_1.default.defaults(inputOptions, {
                            allowOverwrite: false,
                            deleteOriginal: false,
                            simulate: false
                        });
                        return [4 /*yield*/, this.getMegaCmdAndLogin(options.megaCmd, lockingString)];
                    case 1:
                        megaCmd = _c.sent();
                        bytesToUpload = 0;
                        result = {
                            state: 'success',
                            totalBytesTransferred: 0,
                            files: []
                        };
                        if (!megaCmd) {
                            result.state = 'error';
                            result.error = 'unable to lock or login megaCmd';
                            return [2 /*return*/, result];
                        }
                        return [4 /*yield*/, this.getPathType(remotepath, megaCmd)];
                    case 2:
                        remotePathType = _c.sent();
                        if (remotePathType === false)
                            return [2 /*return*/, setError(result, 'unable to check if remotepath exists')];
                        if (remotePathType === 'file' && !options.allowOverwrite)
                            return [2 /*return*/, setError(result, 'overwrite not allowed')];
                        if (remotePathType === 'file' && typeof localpath !== 'string')
                            return [2 /*return*/, setError(result, 'remotepath is a file, but we have multiple localpaths')];
                        localFilePaths = (typeof localpath === 'string' ? [localpath] : localpath);
                        _i = 0, localFilePaths_1 = localFilePaths;
                        _c.label = 3;
                    case 3:
                        if (!(_i < localFilePaths_1.length)) return [3 /*break*/, 7];
                        localFilePath = localFilePaths_1[_i];
                        localName = path_1.default.basename(localFilePath);
                        remotePath = remotePathType === 'directory' ? path_1.default.join(remotepath, localName) : remotepath;
                        remoteName = path_1.default.basename(remotePath);
                        fileCheck = {
                            state: 'success',
                            destinationPath: remotePath,
                            sourcePath: localFilePath,
                            name: remoteName
                        };
                        stats = fs_1.default.statSync(fileCheck.sourcePath, { throwIfNoEntry: false });
                        if (!stats) {
                            fileCheck.state = 'error';
                            fileCheck.error = 'source file not found';
                            result.state = 'error';
                        }
                        else {
                            bytesToUpload += stats.size;
                            if (options.simulate) {
                                fileCheck.bytes = stats.size;
                                result.totalBytesTransferred += stats.size;
                            }
                        }
                        if (!(fileCheck.state !== 'error' && remotePathType === 'directory')) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.getPathType(fileCheck.destinationPath, megaCmd)];
                    case 4:
                        remoteFileType = _c.sent();
                        if (remoteFileType === false)
                            this.consoleLog.warn("unable to check if \"".concat(fileCheck.destinationPath, "\" is already present, let's consider it is not"));
                        if (remoteFileType !== 'none' && !options.allowOverwrite) {
                            fileCheck.state = 'error';
                            fileCheck.error = 'overwrite not allowed';
                            result.state = 'error';
                        }
                        _c.label = 5;
                    case 5:
                        result.files.push(fileCheck);
                        _c.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 3];
                    case 7:
                        if (result.state === 'error') {
                            if (!options.megaCmd)
                                _1.default.unlock(lockingString);
                            return [2 /*return*/, result];
                        }
                        return [4 /*yield*/, megaCmd.df()];
                    case 8:
                        dfResult = _c.sent();
                        if (!dfResult)
                            return [2 /*return*/, setError(result, 'unable to run df')];
                        if (dfResult.freeBytes <= bytesToUpload)
                            return [2 /*return*/, setError(result, 'not enough space')
                                // go!
                            ];
                        if (!!options.simulate) return [3 /*break*/, 13];
                        return [4 /*yield*/, megaCmd.put(localpath, remotepath, options)];
                    case 9:
                        cmdResult = _c.sent();
                        if (!cmdResult) {
                            result.error = 'error in megaCmd upload';
                            result.state = 'error';
                            if (!options.megaCmd)
                                _1.default.unlock(lockingString);
                            return [2 /*return*/, result];
                        }
                        _a = 0, _b = result.files;
                        _c.label = 10;
                    case 10:
                        if (!(_a < _b.length)) return [3 /*break*/, 13];
                        fileTransferResult = _b[_a];
                        localBytes = fs_1.default.statSync(fileTransferResult.sourcePath).size;
                        return [4 /*yield*/, this.isFileOk(fileTransferResult.destinationPath, {
                                expectedBytes: localBytes,
                                megaCmd: megaCmd
                            })];
                    case 11:
                        isFileOk = _c.sent();
                        if (isFileOk.file && isFileOk.file.bytes) {
                            fileTransferResult.bytes = isFileOk.file.bytes;
                            result.totalBytesTransferred += isFileOk.file.bytes;
                        }
                        if (isFileOk.error) {
                            fileTransferResult.error = isFileOk.error;
                            fileTransferResult.state = 'error';
                            result.state = 'error';
                            return [3 /*break*/, 12];
                        }
                        this.consoleLog.debug("\"".concat(fileTransferResult.name, "\" correctly uploaded"));
                        if (options.deleteOriginal)
                            fs_1.default.unlinkSync(fileTransferResult.sourcePath);
                        _c.label = 12;
                    case 12:
                        _a++;
                        return [3 /*break*/, 10];
                    case 13:
                        if (!options.megaCmd)
                            _1.default.unlock(lockingString);
                        return [2 /*return*/, result];
                }
            });
        });
    };
    StorageMega.prototype.rm = function (remotepath, inputOptions) {
        return __awaiter(this, void 0, void 0, function () {
            var lockingString, options, megaCmd, success;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        lockingString = "storage ".concat(this.email, " delete");
                        options = lodash_1.default.defaults(inputOptions, {});
                        return [4 /*yield*/, this.getMegaCmdAndLogin(options.megaCmd, lockingString)];
                    case 1:
                        megaCmd = _a.sent();
                        if (!megaCmd)
                            return [2 /*return*/, 'unable to lock or login megaCmd'];
                        return [4 /*yield*/, megaCmd.rm(remotepath, inputOptions)];
                    case 2:
                        success = _a.sent();
                        return [2 /*return*/, success ? '' : megaCmd.getCmdOutput('stdout')];
                }
            });
        });
    };
    return StorageMega;
}());
exports.default = StorageMega;
