import Path from 'path'
import fs from 'fs'
import ConsoleLog from "@winkgroup/console-log"
import { byteString } from "@winkgroup/misc"
import _ from "lodash"
import MegaCmd, { MegaPutOptions } from "."
import { FileTransferResult, MegaLsOptions, MegaLsResult, MegaRmOptions, StorageMegaIsFileOkResult, TransferResult } from "./common"

export interface StorageMegaInput {
    email: string
    password: string
    timeoutInSecondsToGetMegaCmd?: number
    consoleLog?: ConsoleLog
}

export interface StorageMegaLsOptions extends MegaLsOptions {
    megaCmd?: MegaCmd
}

export interface StorageMegaIsFileOkOptions {
    expectedBytes?: number
    toleranceBytesPercentage: number
    megaCmd?: MegaCmd
}

export interface StorageMegaUploadOptions extends MegaPutOptions {
    megaCmd?: MegaCmd
    allowOverwrite: boolean
    deleteOriginal: boolean
    simulate: boolean
}

export interface StorageMegaDfOptions {
    megaCmd?: MegaCmd
    noLogs: boolean
}

export interface StorageMegaDeleteOptions extends MegaRmOptions {
    megaCmd?: MegaCmd
}

export default class StorageMega {
    email: string
    password: string
    timeoutInSecondsToGetMegaCmd?: number
    consoleLog: ConsoleLog

    constructor(input:StorageMegaInput) {
        this.email = input.email
        this.password = input.password
        this.timeoutInSecondsToGetMegaCmd = input.timeoutInSecondsToGetMegaCmd
        this.consoleLog = input.consoleLog ? input.consoleLog : new ConsoleLog({ prefix: 'StorageMega' })
    }

    protected async getMegaCmdAndLogin(inputMega = null as MegaCmd | null, lockingString:string) {
        let megaCmd = inputMega
        if (!megaCmd) {
            if (typeof this.timeoutInSecondsToGetMegaCmd !== 'undefined') megaCmd = await MegaCmd.getOrWait(lockingString, this.timeoutInSecondsToGetMegaCmd)
                else megaCmd = await MegaCmd.get(lockingString)
            if (!megaCmd) {
                if (this.timeoutInSecondsToGetMegaCmd !== 0) this.consoleLog.warn(`timeout or fail in getOrWait with lockingString "${ lockingString }"`)
                    else this.consoleLog.debug(`megaCmd not available for lockingString "${ lockingString }"`)
                return null
            }
        }

        if (!await megaCmd.login(this.email, this.password)) {
            this.consoleLog.warn(`unable to login with lockingString "${ lockingString }"`)
            if (!inputMega && MegaCmd.getLockedBy() === lockingString) MegaCmd.unlock(lockingString)
            return null
        }

        return megaCmd
    }

    async df(inputOptions?:Partial<StorageMegaDfOptions>) {
        const options = _.defaults(inputOptions, { noLogs: false })
        const lockingString = `storage ${ this.email } df`
        const megaCmd = await this.getMegaCmdAndLogin(options.megaCmd, lockingString)
        if (!megaCmd) return false
        
        const result = await megaCmd.df()

        if (result && !options.noLogs)
            this.consoleLog.print(`free bytes: ${ byteString(result.freeBytes) } / ${ byteString(result.totalBytes) }`)
        
        if (!options.megaCmd) MegaCmd.unlock(lockingString)
        return result
    }

    async getPathType(path:string, inputMegaCmd = null as MegaCmd | null) {
        const lockingString = `storage ${ this.email } getPathType`
        const megaCmd = await this.getMegaCmdAndLogin(inputMegaCmd, lockingString)
        if (!megaCmd) return false

        const result = await megaCmd.ls(path)
        if (!inputMegaCmd) MegaCmd.unlock(lockingString)
        if (result.state === 'error') return false

        if (!result.file) return 'none'
        return result.file.type
    }

    async ls(remotepath = '', inputOptions?:Partial<StorageMegaLsOptions>) {
        const options = _.defaults(inputOptions, {})
        const lockingString = `storage ${ this.email } ls`
        const megaCmd = await this.getMegaCmdAndLogin(options.megaCmd, lockingString)
        if (!megaCmd) {
            const result:MegaLsResult = { state: 'error', error: 'unable to get megaCmd'}
            return result
        }

        const result = await megaCmd.ls(remotepath, inputOptions)
        if (!options.megaCmd) MegaCmd.unlock(lockingString)
        return result
    }

    async isFileOk(remotepath:string, inputOptions?:Partial<StorageMegaIsFileOkOptions>):Promise<StorageMegaIsFileOkResult> {
        const options = _.defaults(inputOptions, {toleranceBytesPercentage: .05})
        const lockingString = `storage ${ this.email } isFileOk`
        const megaCmd = await this.getMegaCmdAndLogin(options.megaCmd, lockingString)
        if (!megaCmd) return { error: 'unable to check' }
        const lsResult = await this.ls(remotepath, { megaCmd: options.megaCmd })
        if (!options.megaCmd) MegaCmd.unlock(lockingString)
        if (lsResult.state == 'error') return { error: 'unable to check' }
        if (!lsResult.file) return { error: 'file not found' }
        
        const result = { file: lsResult.file }
        delete result.file.children

        if (options.expectedBytes) {
            if (!result.file.bytes) return { ...result, error: 'no bytes in file' }
            const byteDiff = Math.abs(result.file.bytes - options.expectedBytes) / options.expectedBytes
            if (byteDiff > options.toleranceBytesPercentage) return { ...result, error: 'file size too different' }
        }

        return result
    }

    async upload(localpath:string | string[], remotepath = '', inputOptions?:Partial<StorageMegaUploadOptions>) {
        const lockingString = `storage ${ this.email } upload`
        const options = _.defaults(inputOptions, {
            allowOverwrite: false,
            deleteOriginal: false,
            simulate: false
        })
        const megaCmd = await this.getMegaCmdAndLogin(options.megaCmd, lockingString)
        let bytesToUpload = 0
        const result:TransferResult = {
            state: 'success',
            totalBytesTransferred: 0,
            files: []
        }

        if (!megaCmd) {
            result.state = 'error'
            result.error = 'unable to lock or login megaCmd'
            return result
        }

        function setError(obj:TransferResult, message:string, unlock = true) {
            obj.state = 'error'
            obj.error = message
            if (!options.megaCmd && unlock) MegaCmd.unlock(lockingString)
            return obj
        }

        // checking if source files exist and destination will not be overwritten
        const remotePathType = await this.getPathType(remotepath, megaCmd)
        if (remotePathType === false)
            return setError(result, 'unable to check if remotepath exists')
        if (remotePathType === 'file' && !options.allowOverwrite) 
            return setError(result, 'overwrite not allowed')
        if (remotePathType === 'file' && typeof localpath !== 'string')
            return setError(result, 'remotepath is a file, but we have multiple localpaths')

        const localFilePaths = (typeof localpath === 'string' ? [ localpath ] : localpath)
        for (const localFilePath of localFilePaths) {
            const localName = Path.basename(localFilePath)
            const remotePath = remotePathType === 'directory' ? Path.join(remotepath, localName) : remotepath
            const remoteName = Path.basename(remotePath)
            const fileCheck:FileTransferResult = {
                state: 'success',
                destinationPath: remotePath,
                sourcePath: localFilePath,
                name: remoteName
            }
            const stats = fs.statSync(fileCheck.sourcePath, {throwIfNoEntry: false})
            if (!stats) {
                fileCheck.state = 'error'
                fileCheck.error = 'source file not found'
                result.state = 'error'
            } else {
                bytesToUpload += stats.size
                if (options.simulate) {
                    fileCheck.bytes = stats.size
                    result.totalBytesTransferred += stats.size
                }
            }
            
            if (fileCheck.state !== 'error' && remotePathType === 'directory') {
                const remoteFileType = await this.getPathType(fileCheck.destinationPath, megaCmd)
                if (remoteFileType === false) this.consoleLog.warn(`unable to check if "${ fileCheck.destinationPath }" is already present, let's consider it is not`)
                if (remoteFileType !== 'none' && !options.allowOverwrite) {
                    fileCheck.state = 'error'
                    fileCheck.error = 'overwrite not allowed'
                    result.state = 'error'
                }
            }

            result.files.push(fileCheck)
        }
        if (result.state === 'error') {
            if (!options.megaCmd) MegaCmd.unlock(lockingString)
            return result
        }

        const dfResult = await megaCmd.df()
        if (!dfResult) return setError(result, 'unable to run df')
        if (dfResult.freeBytes <= bytesToUpload) return setError(result, 'not enough space')

        // go!
        if (!options.simulate) {
            const cmdResult = await megaCmd.put(localpath, remotepath, options)
            if (!cmdResult) {
                result.error = 'error in megaCmd upload'
                result.state = 'error'
                if (!options.megaCmd) MegaCmd.unlock(lockingString)
                return result
            }
        
            // check
            for(const fileTransferResult of result.files) {
                const localBytes = fs.statSync(fileTransferResult.sourcePath).size
                const isFileOk = await this.isFileOk(fileTransferResult.destinationPath, {
                    expectedBytes: localBytes,
                    megaCmd: megaCmd
                })
    
                if (isFileOk.file && isFileOk.file.bytes) {
                    fileTransferResult.bytes = isFileOk.file.bytes
                    result.totalBytesTransferred += isFileOk.file.bytes
                }
    
                if (isFileOk.error) {
                    fileTransferResult.error = isFileOk.error
                    fileTransferResult.state = 'error'
                    result.state = 'error'
                    continue
                }
    
                this.consoleLog.debug(`"${ fileTransferResult.name }" correctly uploaded`)
                if (options.deleteOriginal) fs.unlinkSync(fileTransferResult.sourcePath)
            }
        }

        if (!options.megaCmd) MegaCmd.unlock(lockingString)

        return result
    }

    async rm(remotepath:string, inputOptions?:Partial<StorageMegaDeleteOptions>) {
        const lockingString = `storage ${ this.email } delete`
        const options = _.defaults(inputOptions, {})
        const megaCmd = await this.getMegaCmdAndLogin(options.megaCmd, lockingString)
        if (!megaCmd) return 'unable to lock or login megaCmd'
        const success = await megaCmd.rm(remotepath, inputOptions)
        return success ? '' : megaCmd.getCmdOutput('stdout')
    }
}