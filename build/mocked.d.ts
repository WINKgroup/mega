import MegaCmd from ".";
import { MegaCmdOptions, MegaDfResult, MegaLsOptions, MegaLsResult, MegaRmOptions } from "./common";
export default class MegaCmdMocked extends MegaCmd {
    mockedEmail: string | null;
    constructor(inputOptions?: MegaCmdOptions);
    whoAmI(): Promise<string | null>;
    login(email: string, password: string): Promise<boolean>;
    logout(): Promise<void>;
    df(): Promise<MegaDfResult | false>;
    ls(remotepath?: string, inputOptions?: Partial<MegaLsOptions>): Promise<MegaLsResult>;
    rm(remotepath: string, inputOptions?: Partial<MegaRmOptions>): Promise<boolean>;
}
