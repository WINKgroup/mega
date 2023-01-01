/// <reference types="node" />
import Cmd, { CmdOptions } from "@winkgroup/cmd";
import ConsoleLog from "@winkgroup/console-log";
import EventQueue from "@winkgroup/event-queue";
import { EventEmitter } from "node:events";
import { MegaCmdOptions, MegaDfResult, MegaLsOptions, MegaLsResult, MegaRmOptions } from "./common";
/***********     MEGA GET       ***********/
export interface MegaGetOptions extends CmdOptions {
    merge: boolean;
    usePcre: boolean;
    onTransfer?: EventEmitter;
}
/***********      MEGA PUT       ***********/
export interface MegaPutOptions extends CmdOptions {
    createRemoteFolder: boolean;
    onTransfer?: EventEmitter;
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
    df(): Promise<MegaDfResult | false>;
    ls(remotepath?: string, inputOptions?: Partial<MegaLsOptions>): Promise<MegaLsResult>;
    put(localpath: string | string[], remotepath?: string, inputOptions?: Partial<MegaPutOptions>): Promise<boolean>;
    get(remotepath: string, localpath?: string, inputOptions?: Partial<MegaGetOptions>): Promise<boolean>;
    private transfer;
    rm(remotepath: string, inputOptions?: Partial<MegaRmOptions>): Promise<boolean>;
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
