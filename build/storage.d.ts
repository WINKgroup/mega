import ConsoleLog from "@winkgroup/console-log";
import MegaCmd, { MegaCmdPutOptions } from ".";
import { MegaCmdDfResult, MegaCmdFile, MegaCmdFileType, MegaCmdLsOptions, MegaCmdRmOptions, StorageMegaIsFileOkOptions, StorageMegaIsFileOkResult, StorageMegaMethodResponse, StorageMegaTransferResult } from "./common";
export interface StorageMegaInput {
    email: string;
    password: string;
    timeoutInSecondsToGetMegaCmd?: number;
    consoleLog?: ConsoleLog;
    megaCmd?: MegaCmd;
}
export interface StorageMegaUploadOptions extends MegaCmdPutOptions {
    allowOverwrite: boolean;
    deleteOriginal: boolean;
}
export interface StorageMegaDfOptions {
    noLogs: boolean;
}
type StorageMegaLockAndLogin = 'already locked' | 'newly locked' | 'unable to lock' | 'unable to login';
export default class StorageMega {
    email: string;
    password: string;
    timeoutInSecondsToGetMegaCmd?: number;
    megaCmd: MegaCmd | null;
    consoleLog: ConsoleLog;
    constructor(input: StorageMegaInput);
    getMegaCmdAndLogin(lockingString: string): Promise<StorageMegaLockAndLogin>;
    protected unlockEventually(lockingString: string, lockAndLogin: StorageMegaLockAndLogin): void;
    df(inputOptions?: Partial<StorageMegaDfOptions>): Promise<StorageMegaMethodResponse<MegaCmdDfResult>>;
    getPathType(path: string): Promise<StorageMegaMethodResponse<"none" | MegaCmdFileType>>;
    ls(remotepath?: string, inputOptions?: Partial<MegaCmdLsOptions>): Promise<StorageMegaMethodResponse<MegaCmdFile>>;
    isFileOk(remotepath: string, expectedBytes: number, inputOptions?: Partial<StorageMegaIsFileOkOptions>): Promise<StorageMegaMethodResponse<StorageMegaIsFileOkResult>>;
    upload(localpath: string | string[], remotepath?: string, inputOptions?: Partial<StorageMegaUploadOptions>): Promise<StorageMegaMethodResponse<StorageMegaTransferResult>>;
    rm(remotepath: string, inputOptions?: Partial<MegaCmdRmOptions>): Promise<{
        state: "error" | "success";
        error: StorageMegaLockAndLogin;
    } | {
        state: boolean;
        error: string;
    }>;
    static isLockAndLoginOk(lockAndLogin: StorageMegaLockAndLogin): boolean;
    static errorResponseForLockAndLogin(lockAndLogin: StorageMegaLockAndLogin): {
        state: "error" | "success";
        error: StorageMegaLockAndLogin;
    };
}
export {};
