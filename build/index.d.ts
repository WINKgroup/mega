/// <reference types="node" />
import Cmd, { CmdOptions } from "@winkgroup/cmd";
import ConsoleLog from "@winkgroup/console-log";
import EventQueue from "@winkgroup/event-queue";
import { EventEmitter } from "node:events";
import { MegaCmdGetTransferResult, MegaCmdOptions, MegaCmdDfResult, MegaCmdLsOptions, MegaCmdLsResult, MegaCmdRmOptions, MegaTransferResult } from "./common";
export interface MegaCmdGetOptions extends CmdOptions {
    merge: boolean;
    usePcre: boolean;
    onProgress?: EventEmitter;
}
export interface MegaCmdPutOptions extends CmdOptions {
    createRemoteFolder: boolean;
    onProgress?: EventEmitter;
}
export default class MegaCmd {
    protected runningCmd: Cmd | null;
    consoleLog: ConsoleLog;
    protected static started: boolean | null;
    protected static lockedBy: string;
    static onIdle: EventQueue;
    static getLockedBy(): string;
    static consoleLog: ConsoleLog;
    protected constructor(inputOptions?: Partial<MegaCmdOptions>);
    protected run(cmd: string, inputCmdOptions?: Partial<CmdOptions>): Promise<Cmd>;
    getCmdOutput(stream?: "stdout" | "stderr"): string;
    whoAmI(): Promise<string | null>;
    login(email: string, password: string): Promise<boolean>;
    logout(): Promise<void>;
    df(): Promise<MegaCmdDfResult | false>;
    ls(remotepath?: string, inputOptions?: Partial<MegaCmdLsOptions>): Promise<MegaCmdLsResult>;
    pwd(): Promise<string | false>;
    getRemotePathType(remotepath: string): Promise<false | "none" | import("./common").MegaCmdFileType>;
    getRemoteAbsolutePathWithCurrentWorkingDirectory(remotepath: string): Promise<string | false>;
    put2transfers(localpath: string | string[], remotepath?: string): Promise<false | MegaTransferResult>;
    put(localpath: string | string[], remotepath?: string, inputOptions?: Partial<MegaCmdPutOptions>): Promise<boolean>;
    get(remotepath: string, localpath?: string, inputOptions?: Partial<MegaCmdGetOptions>): Promise<boolean>;
    protected progress(cmd: Cmd, inputOptions?: EventEmitter): Promise<void>;
    getTransfers(): Promise<false | MegaCmdGetTransferResult[]>;
    protected actionTransfers(actionOption: string, tag?: number): Promise<boolean>;
    pauseTransfers(tag?: number): Promise<boolean>;
    resumeTransfers(tag?: number): Promise<boolean>;
    cancelTransfers(tag?: number): Promise<boolean>;
    rm(remotepath: string, inputOptions?: Partial<MegaCmdRmOptions>): Promise<boolean>;
    static isIdle(): Promise<boolean>;
    static getProxy(): Promise<{
        type: string;
        url: string;
    } | null>;
    static setProxy(type: 'none' | 'auto' | string): Promise<void>;
    static startup(): Promise<boolean>;
    static get(lockedBy?: string): Promise<MegaCmd | null>;
    static unlock(lockedBy: string): boolean;
    static getOrWait(lockedBy?: string, timeoutInSeconds?: number): Promise<MegaCmd | null>;
    static getNameFromPath(path: string): string;
}
