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
interface MegaLs {
    usePcre: boolean;
    recursive: boolean;
}
export interface MegaLsOptions extends Partial<CmdOptions>, MegaLs {
}
export interface MegaLsResult {
    state: 'success' | 'error';
    error?: string;
    file?: MegaCmdFile | false;
}
/***********      RM       ***********/
export interface MegaRmOptions extends Partial<CmdOptions> {
    recursive: boolean;
    usePcre: boolean;
}
/***********      DF       ***********/
export interface MegaDfResultSection {
    bytes: number;
    numOfFiles: number;
    numOfFolders: number;
}
export interface MegaDfResult {
    freeBytes: number;
    totalBytes: number;
    fileVersionsBytes: number;
    inbox: MegaDfResultSection;
    drive: MegaDfResultSection;
    trash: MegaDfResultSection;
}
/***********      STORAGE MEGA       ***********/
export interface StorageMegaIsFileOkResult {
    error?: 'unable to check' | 'file not found' | 'no bytes in file' | 'file size too different';
    file?: MegaCmdFile;
}
export interface FileTransferMatch {
    name: string;
    sourcePath: string;
    destinationPath: string;
    bytes?: number;
}
export interface FileTransferResult extends FileTransferMatch {
    state: 'success' | 'error';
    error?: string;
}
export interface TransferResult {
    state: 'success' | 'error';
    totalBytesTransferred: number;
    error?: string;
    files: FileTransferResult[];
}
export {};
