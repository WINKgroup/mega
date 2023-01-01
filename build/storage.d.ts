import ConsoleLog from "@winkgroup/console-log";
import MegaCmd, { MegaPutOptions } from ".";
import { MegaLsOptions, MegaLsResult, MegaRmOptions, StorageMegaIsFileOkResult, TransferResult } from "./common";
export interface StorageMegaInput {
    email: string;
    password: string;
    timeoutInSecondsToGetMegaCmd?: number;
    consoleLog?: ConsoleLog;
}
export interface StorageMegaLsOptions extends MegaLsOptions {
    megaCmd?: MegaCmd;
}
export interface StorageMegaIsFileOkOptions {
    expectedBytes?: number;
    toleranceBytesPercentage: number;
    megaCmd?: MegaCmd;
}
export interface StorageMegaUploadOptions extends MegaPutOptions {
    megaCmd?: MegaCmd;
    allowOverwrite: boolean;
    deleteOriginal: boolean;
    simulate: boolean;
}
export interface StorageMegaDfOptions {
    megaCmd?: MegaCmd;
    noLogs: boolean;
}
export interface StorageMegaDeleteOptions extends MegaRmOptions {
    megaCmd?: MegaCmd;
}
export default class StorageMega {
    email: string;
    password: string;
    timeoutInSecondsToGetMegaCmd?: number;
    consoleLog: ConsoleLog;
    constructor(input: StorageMegaInput);
    protected getMegaCmdAndLogin(inputMega: MegaCmd | null | undefined, lockingString: string): Promise<MegaCmd | null>;
    df(inputOptions?: Partial<StorageMegaDfOptions>): Promise<false | import("./common").MegaDfResult>;
    getPathType(path: string, inputMegaCmd?: MegaCmd | null): Promise<false | "none" | import("./common").MegaCmdFileType>;
    ls(remotepath?: string, inputOptions?: Partial<StorageMegaLsOptions>): Promise<MegaLsResult>;
    isFileOk(remotepath: string, inputOptions?: Partial<StorageMegaIsFileOkOptions>): Promise<StorageMegaIsFileOkResult>;
    upload(localpath: string | string[], remotepath?: string, inputOptions?: Partial<StorageMegaUploadOptions>): Promise<TransferResult>;
    rm(remotepath: string, inputOptions?: Partial<StorageMegaDeleteOptions>): Promise<string>;
}
