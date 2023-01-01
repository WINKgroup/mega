import MegaCmd, { MegaGetOptions, MegaPutOptions } from "."
import { MegaCmdFile, MegaCmdOptions, MegaDfResult, MegaLsOptions, MegaLsResult, MegaRmOptions } from "./common"

export default class MegaCmdMocked extends MegaCmd {
    mockedEmail = 'test@email.com' as string | null
    
    constructor(inputOptions?:MegaCmdOptions) {
        super(inputOptions)
    }

    async whoAmI() { return this.mockedEmail }
    
    async login (email:string, password:string) {
        this.mockedEmail = email
        return true
    }

    async logout() { this.mockedEmail = null }

    async df():Promise<MegaDfResult | false> {
        return {
            trash: {
                bytes: 0,
                numOfFiles: 0,
                numOfFolders: 0
            },
            inbox: {
                bytes: 0,
                numOfFiles: 0,
                numOfFolders: 0
            },
            drive: {
                bytes: 1000000,
                numOfFiles: 1,
                numOfFolders: 0
            },
            freeBytes: 1000000000,
            totalBytes: 50000000000,
            fileVersionsBytes: 0
        }
    }

    async ls(remotepath = '', inputOptions?:Partial<MegaLsOptions>) {
        const result:MegaLsResult = {
            state: 'success',
            file: {
                name: 'test.mp4',
                path: 'test.mp4',
                type: 'file',
                bytes: 1000000
            }
        }
        return result
    }
/*
    async put(localpath:string | string[], remotepath = '', inputOptions?:Partial<MegaPutOptions>) {
        await this.transferMock()
        return true
    }

    async get(remotepath:string, localpath = '', inputOptions?:Partial<MegaGetOptions>) {
        await this.transferMock()
        return true
    }

    protected transferMock():Promise<void> {
        const mega = this
        return new Promise((resolve) => {
            let bytes = 0
            const totalBytes = 1000000
            const interval = setInterval( () => {
                bytes += 1000
                if (bytes >= totalBytes) {
                    clearInterval(interval)
                    resolve()
                    return
                }
                mega.emit('progress', {
                    bytes: bytes,
                    totalBytes: totalBytes,
                    percentage: bytes / totalBytes
                })
            })
        })
    }
*/
    async rm(remotepath:string, inputOptions?:Partial<MegaRmOptions>) {
        return true
    }
}