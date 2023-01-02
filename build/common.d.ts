import { CmdOptions } from "@winkgroup/cmd";
import ConsoleLog from "@winkgroup/console-log";
export interface MegaCmdOptions {
    consoleLog: ConsoleLog;
}
export declare type MegaCmdFileType = 'file' | 'directory';
export interface MegaCmdFile {
    name: string;
    path: string;
    type: MegaCmdFileType;
    versions?: number;
    bytes?: number;
    children?: MegaCmdFile[];
    updatedAt?: string;
}
export declare function getBytesByChildren(dir: MegaCmdFile): number | false;
/***********      LS       ***********/
interface MegaCmdLs {
    usePcre: boolean;
    recursive: boolean;
}
export interface MegaCmdLsOptions extends Partial<CmdOptions>, MegaCmdLs {
}
export interface MegaCmdLsResult {
    state: 'success' | 'error';
    error?: string;
    file?: MegaCmdFile;
}
/***********      RM       ***********/
export interface MegaCmdRmOptions extends Partial<CmdOptions> {
    recursive: boolean;
    usePcre: boolean;
}
/***********      DF       ***********/
export interface MegaCmdDfResultSection {
    bytes: number;
    numOfFiles: number;
    numOfFolders: number;
}
export interface MegaCmdDfResult {
    freeBytes: number;
    totalBytes: number;
    fileVersionsBytes: number;
    inbox: MegaCmdDfResultSection;
    drive: MegaCmdDfResultSection;
    trash: MegaCmdDfResultSection;
}
/***********      TRANSFER       ***********/
export interface MegaTransfer {
    direction: string;
    sourcePath: string;
    destinationPath: string;
}
export interface MegaTransferFile extends MegaTransfer {
    bytes: number;
}
export interface MegaTransferResult {
    totalBytes: number;
    transfers: MegaTransferFile[];
}
export interface MegaCmdGetTransferResult extends MegaTransfer {
    tag: number;
    percentage: number;
    totalBytes: number;
    state: string;
}
export interface MegaCmdProgressTransfer extends MegaTransfer {
    tag: number;
}
/***********      STORAGE MEGA       ***********/
export interface StorageMegaMethodResponse<T> {
    state: 'success' | 'error';
    error?: string;
    result?: T;
}
export interface StorageMegaIsFileOkOptions {
    toleranceBytesPercentage: number;
}
export interface StorageMegaIsFileOkResult {
    isOk: boolean;
    remoteBytes: number;
    message?: 'file not found' | 'file size too different';
}
export interface StorageMegaTransferFile {
    sourcePath: string;
    destinationPath: string;
    error?: string;
    bytes: number;
    state: 'success' | 'error';
}
export interface StorageMegaTransferResult {
    direction: 'upload' | 'download';
    totalBytes: number;
    transfers: StorageMegaTransferFile[];
}
export {};
