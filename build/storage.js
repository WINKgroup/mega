"use strict";
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
var console_log_1 = __importDefault(require("@winkgroup/console-log"));
var misc_1 = require("@winkgroup/misc");
var fs_1 = __importDefault(require("fs"));
var lodash_1 = __importDefault(require("lodash"));
var _1 = __importDefault(require("."));
var StorageMega = /** @class */ (function () {
    function StorageMega(input) {
        this.megaCmd = null;
        this.email = input.email;
        this.password = input.password;
        this.timeoutInSecondsToGetMegaCmd = input.timeoutInSecondsToGetMegaCmd;
        this.consoleLog = input.consoleLog ? input.consoleLog : new console_log_1.default({ prefix: 'StorageMega' });
        if (input.megaCmd)
            this.megaCmd = input.megaCmd;
    }
    StorageMega.prototype.getMegaCmdAndLogin = function (lockingString) {
        return __awaiter(this, void 0, void 0, function () {
            var previouslyLocked, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        previouslyLocked = !!this.megaCmd;
                        if (!!this.megaCmd) return [3 /*break*/, 5];
                        if (!(typeof this.timeoutInSecondsToGetMegaCmd !== 'undefined')) return [3 /*break*/, 2];
                        _a = this;
                        return [4 /*yield*/, _1.default.getOrWait(lockingString, this.timeoutInSecondsToGetMegaCmd)];
                    case 1:
                        _a.megaCmd = _c.sent();
                        return [3 /*break*/, 4];
                    case 2:
                        _b = this;
                        return [4 /*yield*/, _1.default.get(lockingString)];
                    case 3:
                        _b.megaCmd = _c.sent();
                        _c.label = 4;
                    case 4:
                        if (!this.megaCmd) {
                            if (this.timeoutInSecondsToGetMegaCmd !== 0)
                                this.consoleLog.warn("timeout or fail in getOrWait with lockingString \"".concat(lockingString, "\""));
                            else
                                this.consoleLog.debug("megaCmd not available for lockingString \"".concat(lockingString, "\""));
                            return [2 /*return*/, 'unable to lock'];
                        }
                        _c.label = 5;
                    case 5: return [4 /*yield*/, this.megaCmd.login(this.email, this.password)];
                    case 6:
                        if (!(_c.sent())) {
                            this.consoleLog.warn("unable to login with lockingString \"".concat(lockingString, "\""));
                            _1.default.unlock(lockingString);
                            return [2 /*return*/, 'unable to login'];
                        }
                        return [2 /*return*/, previouslyLocked ? 'already locked' : 'newly locked'];
                }
            });
        });
    };
    StorageMega.prototype.unlockEventually = function (lockingString, lockAndLogin) {
        if (lockAndLogin === 'newly locked')
            _1.default.unlock(lockingString);
    };
    StorageMega.prototype.df = function (inputOptions) {
        return __awaiter(this, void 0, void 0, function () {
            var options, lockingString, lockResult, megaCmd, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options = lodash_1.default.defaults(inputOptions, { noLogs: false });
                        lockingString = "storage ".concat(this.email, " df");
                        return [4 /*yield*/, this.getMegaCmdAndLogin(lockingString)];
                    case 1:
                        lockResult = _a.sent();
                        if (!StorageMega.isLockAndLoginOk(lockResult))
                            return [2 /*return*/, StorageMega.errorResponseForLockAndLogin(lockResult)];
                        megaCmd = this.megaCmd;
                        return [4 /*yield*/, megaCmd.df()];
                    case 2:
                        result = _a.sent();
                        this.unlockEventually(lockingString, lockResult);
                        if (!result)
                            return [2 /*return*/, { state: 'error', error: 'unable to df / parsing error' }];
                        if (!options.noLogs)
                            this.consoleLog.print("free bytes: ".concat((0, misc_1.byteString)(result.freeBytes), " / ").concat((0, misc_1.byteString)(result.totalBytes)));
                        return [2 /*return*/, { state: 'success', result: result }];
                }
            });
        });
    };
    StorageMega.prototype.getPathType = function (path) {
        return __awaiter(this, void 0, void 0, function () {
            var lockingString, lockResult, megaCmd, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        lockingString = "storage ".concat(this.email, " getPathType");
                        return [4 /*yield*/, this.getMegaCmdAndLogin(lockingString)];
                    case 1:
                        lockResult = _a.sent();
                        if (!StorageMega.isLockAndLoginOk(lockResult))
                            return [2 /*return*/, StorageMega.errorResponseForLockAndLogin(lockResult)];
                        megaCmd = this.megaCmd;
                        return [4 /*yield*/, megaCmd.getRemotePathType(path)];
                    case 2:
                        result = _a.sent();
                        this.unlockEventually(lockingString, lockResult);
                        if (result === false)
                            return [2 /*return*/, { state: 'error', error: 'unable to get path type' }];
                        return [2 /*return*/, { state: 'success', result: result }];
                }
            });
        });
    };
    StorageMega.prototype.ls = function (remotepath, inputOptions) {
        if (remotepath === void 0) { remotepath = ''; }
        return __awaiter(this, void 0, void 0, function () {
            var lockingString, lockResult, megaCmd, result, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        lockingString = "storage ".concat(this.email, " ls");
                        return [4 /*yield*/, this.getMegaCmdAndLogin(lockingString)];
                    case 1:
                        lockResult = _a.sent();
                        if (!StorageMega.isLockAndLoginOk(lockResult))
                            return [2 /*return*/, StorageMega.errorResponseForLockAndLogin(lockResult)];
                        megaCmd = this.megaCmd;
                        return [4 /*yield*/, megaCmd.ls(remotepath, inputOptions)];
                    case 2:
                        result = _a.sent();
                        this.unlockEventually(lockingString, lockResult);
                        response = {
                            state: result.state,
                            error: result.error,
                            result: result.file
                        };
                        return [2 /*return*/, response];
                }
            });
        });
    };
    StorageMega.prototype.isFileOk = function (remotepath, expectedBytes, inputOptions) {
        return __awaiter(this, void 0, void 0, function () {
            var options, lsResult, file, byteDiff;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options = lodash_1.default.defaults(inputOptions, { toleranceBytesPercentage: .05 });
                        return [4 /*yield*/, this.ls(remotepath, { recursive: true })];
                    case 1:
                        lsResult = _a.sent();
                        if (lsResult.state === 'error')
                            return [2 /*return*/, { state: 'error', error: lsResult.error }];
                        if (!lsResult.result)
                            return [2 /*return*/, { state: 'success', result: { isOk: false, message: 'file not found', remoteBytes: 0 } }];
                        file = lsResult.result;
                        if (!file.bytes)
                            return [2 /*return*/, { state: 'error', error: 'no bytes in file' }];
                        byteDiff = Math.abs(file.bytes - expectedBytes) / expectedBytes;
                        if (byteDiff > options.toleranceBytesPercentage)
                            return [2 /*return*/, { state: 'success', result: { isOk: false, message: 'file size too different', remoteBytes: file.bytes } }];
                        return [2 /*return*/, { state: 'success', result: { isOk: true, remoteBytes: file.bytes } }];
                }
            });
        });
    };
    StorageMega.prototype.upload = function (localpath, remotepath, inputOptions) {
        if (remotepath === void 0) { remotepath = ''; }
        return __awaiter(this, void 0, void 0, function () {
            var options, lockingString, lockResult, megaCmd, responseState, result, setError, filesToUpload, remotepath_1, fileTypeResponse, error, dfResult, cmdResult, _i, _a, fileTransferExpected, localBytes, isFileOkResponse, isFileOkResult, transferResult, transferStr;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        options = lodash_1.default.defaults(inputOptions, { allowOverwrite: false, deleteOriginal: false });
                        lockingString = "storage ".concat(this.email, " upload");
                        return [4 /*yield*/, this.getMegaCmdAndLogin(lockingString)];
                    case 1:
                        lockResult = _b.sent();
                        if (!StorageMega.isLockAndLoginOk(lockResult))
                            return [2 /*return*/, StorageMega.errorResponseForLockAndLogin(lockResult)];
                        megaCmd = this.megaCmd;
                        responseState = 'success';
                        result = {
                            direction: 'upload',
                            totalBytes: 0,
                            transfers: []
                        };
                        setError = function (error) {
                            _this.unlockEventually(lockingString, lockResult);
                            return { state: 'error', error: error };
                        };
                        return [4 /*yield*/, megaCmd.put2transfers(localpath, remotepath)];
                    case 2:
                        filesToUpload = _b.sent();
                        if (!filesToUpload)
                            return [2 /*return*/, setError('unable to determinate transfers during upload')];
                        if (filesToUpload.transfers.length === 0) {
                            this.unlockEventually(lockingString, lockResult);
                            return [2 /*return*/, { state: 'success', result: result }];
                        }
                        if (!!options.allowOverwrite) return [3 /*break*/, 5];
                        if (!(filesToUpload.transfers.length > 1)) return [3 /*break*/, 3];
                        // TODO
                        throw new Error('allowOverwrite on multiple files not implemented: should match ls with list of transfers');
                    case 3:
                        remotepath_1 = filesToUpload.transfers[0].destinationPath;
                        return [4 /*yield*/, this.getPathType(remotepath_1)];
                    case 4:
                        fileTypeResponse = _b.sent();
                        error = '';
                        if (fileTypeResponse.state === 'error')
                            error = fileTypeResponse.error;
                        else if (fileTypeResponse.result !== 'none')
                            error = "overwriting \"".concat(remotepath_1, "\" not allowed");
                        if (error)
                            return [2 /*return*/, setError(error)];
                        _b.label = 5;
                    case 5: return [4 /*yield*/, this.df()];
                    case 6:
                        dfResult = _b.sent();
                        if (dfResult.error)
                            return [2 /*return*/, setError(dfResult.error)];
                        if (dfResult.result.freeBytes <= filesToUpload.totalBytes)
                            return [2 /*return*/, setError('not enough space')
                                // go!
                            ];
                        return [4 /*yield*/, megaCmd.put(localpath, remotepath, options)];
                    case 7:
                        cmdResult = _b.sent();
                        if (!cmdResult)
                            return [2 /*return*/, setError('error in megaCmd upload')
                                // check
                            ];
                        _i = 0, _a = filesToUpload.transfers;
                        _b.label = 8;
                    case 8:
                        if (!(_i < _a.length)) return [3 /*break*/, 11];
                        fileTransferExpected = _a[_i];
                        localBytes = fileTransferExpected.bytes;
                        return [4 /*yield*/, this.isFileOk(fileTransferExpected.destinationPath, localBytes)];
                    case 9:
                        isFileOkResponse = _b.sent();
                        if (isFileOkResponse.state === 'error')
                            return [2 /*return*/, setError(isFileOkResponse.error)];
                        isFileOkResult = isFileOkResponse.result;
                        result.totalBytes += isFileOkResult.remoteBytes;
                        transferResult = {
                            sourcePath: fileTransferExpected.sourcePath,
                            destinationPath: fileTransferExpected.destinationPath,
                            state: isFileOkResult.isOk ? 'success' : 'error',
                            error: isFileOkResult.message,
                            bytes: isFileOkResult.remoteBytes
                        };
                        result.transfers.push(transferResult);
                        transferStr = "upload ".concat(fileTransferExpected.sourcePath, " => ").concat(fileTransferExpected.destinationPath);
                        if (!isFileOkResult.isOk) {
                            responseState = 'error';
                            this.consoleLog.error(transferStr + ": ".concat(isFileOkResult.message));
                        }
                        else
                            this.consoleLog.debug(transferStr + ": ok!");
                        if (options.deleteOriginal && isFileOkResult.isOk)
                            fs_1.default.unlinkSync(fileTransferExpected.sourcePath);
                        _b.label = 10;
                    case 10:
                        _i++;
                        return [3 /*break*/, 8];
                    case 11:
                        this.unlockEventually(lockingString, lockResult);
                        return [2 /*return*/, { state: 'success', result: result }];
                }
            });
        });
    };
    StorageMega.prototype.rm = function (remotepath, inputOptions) {
        return __awaiter(this, void 0, void 0, function () {
            var lockingString, lockResult, megaCmd, success;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        lockingString = "storage ".concat(this.email, " rm");
                        return [4 /*yield*/, this.getMegaCmdAndLogin(lockingString)];
                    case 1:
                        lockResult = _a.sent();
                        if (!StorageMega.isLockAndLoginOk(lockResult))
                            return [2 /*return*/, StorageMega.errorResponseForLockAndLogin(lockResult)];
                        megaCmd = this.megaCmd;
                        return [4 /*yield*/, megaCmd.rm(remotepath, inputOptions)];
                    case 2:
                        success = _a.sent();
                        return [2 /*return*/, { state: success, error: success ? '' : megaCmd.getCmdOutput('stdout') }];
                }
            });
        });
    };
    StorageMega.isLockAndLoginOk = function (lockAndLogin) {
        return ['newly locked', 'already locked'].indexOf(lockAndLogin) !== -1;
    };
    StorageMega.errorResponseForLockAndLogin = function (lockAndLogin) {
        return {
            state: 'error',
            error: lockAndLogin
        };
    };
    return StorageMega;
}());
exports.default = StorageMega;
