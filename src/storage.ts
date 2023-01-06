import ConsoleLog, { LogLevel } from "@winkgroup/console-log"
import { byteString } from "@winkgroup/misc"
import fs from 'fs'
import _ from "lodash"
import MegaCmd, { MegaCmdPutOptions } from "."
import { MegaCmdDfResult, MegaCmdFile, MegaCmdFileType, MegaCmdLsOptions, MegaCmdLsResult, MegaCmdRmOptions, MegaTransferResult, StorageMegaIsFileOkOptions, StorageMegaIsFileOkResult, StorageMegaMethodResponse, StorageMegaTransferFile, StorageMegaTransferResult } from "./common"

export interface StorageMegaInput {
    email: string
    password: string
    timeoutInSecondsToGetMegaCmd?: number
    consoleLog?: ConsoleLog
    megaCmd?: MegaCmd
}

export interface StorageMegaUploadOptions extends MegaCmdPutOptions {
    allowOverwrite: boolean
    deleteOriginal: boolean
    transfers: MegaTransferResult
}

export interface StorageMegaDfOptions {
    noLogs: boolean
}

export type StorageMegaLockAndLogin = 'already locked' | 'newly locked' | 'unable to lock' | 'unable to login' | 'storage error'

export default class StorageMega {
    email: string
    password: string
    timeoutInSecondsToGetMegaCmd?: number
    megaCmd = null as MegaCmd | null
    consoleLog: ConsoleLog

    constructor(input:StorageMegaInput) {
        this.email = input.email
        this.password = input.password
        this.timeoutInSecondsToGetMegaCmd = input.timeoutInSecondsToGetMegaCmd
        this.consoleLog = input.consoleLog ? input.consoleLog : new ConsoleLog({ prefix: 'StorageMega' })
        if (input.megaCmd) this.megaCmd = input.megaCmd
    }

    async getMegaCmdAndLogin(lockingString:string):Promise<StorageMegaLockAndLogin> {
        const previouslyLocked = !!this.megaCmd

        if (!this.megaCmd) {
            if (typeof this.timeoutInSecondsToGetMegaCmd !== 'undefined') this.megaCmd = await MegaCmd.getOrWait(lockingString, this.timeoutInSecondsToGetMegaCmd)
                else this.megaCmd = await MegaCmd.get(lockingString)
            if (!this.megaCmd) {
                if (this.timeoutInSecondsToGetMegaCmd !== 0) this.consoleLog.warn(`timeout or fail in getOrWait with lockingString "${ lockingString }" ( currently locked by ${ MegaCmd.getLockedBy() } )`)
                    else this.consoleLog.debug(`megaCmd not available for lockingString "${ lockingString }"`)
                return 'unable to lock'
            }
        }

        this.megaCmd.consoleLog = this.consoleLog.spawn()
        if (!await this.megaCmd.login(this.email, this.password)) {
            this.consoleLog.warn(`unable to login with lockingString "${ lockingString }"`)
            MegaCmd.unlock(lockingString)
            return 'unable to login'
        }

        return previouslyLocked ? 'already locked' : 'newly locked'
    }

    protected unlockEventually(lockingString:string, lockAndLogin:StorageMegaLockAndLogin) {
        if (lockAndLogin === 'newly locked') MegaCmd.unlock(lockingString)
    }

    async df(inputOptions?:Partial<StorageMegaDfOptions>):Promise<StorageMegaMethodResponse<MegaCmdDfResult>> {
        const options = _.defaults(inputOptions, { noLogs: false })
        const lockingString = `storage ${ this.email } df`
        const lockResult = await this.getMegaCmdAndLogin(lockingString)
        if (!StorageMega.isLockAndLoginOk(lockResult)) return StorageMega.errorResponseForLockAndLogin(lockResult)
        const megaCmd = this.megaCmd!
        
        const previousMegaCmdConsoleLog = megaCmd.consoleLog.spawn()
        if (options.noLogs) megaCmd.consoleLog.generalOptions.verbosity = LogLevel.WARN
        const result = await megaCmd.df()
        megaCmd.consoleLog = previousMegaCmdConsoleLog
        this.unlockEventually(lockingString, lockResult)

        if (!result) return { state: 'error', error: 'unable to df / parsing error' }

        if (!options.noLogs)
            this.consoleLog.print(`free bytes: ${ byteString(result.freeBytes) } / ${ byteString(result.totalBytes) }`)
        
        return { state:'success', result: result }
    }

    async getPathType(path:string):Promise<StorageMegaMethodResponse<"none" | MegaCmdFileType>> {
        const lockingString = `storage ${ this.email } getPathType`
        const lockResult = await this.getMegaCmdAndLogin(lockingString)
        if (!StorageMega.isLockAndLoginOk(lockResult)) return StorageMega.errorResponseForLockAndLogin(lockResult)
        const megaCmd = this.megaCmd!

        const result = await megaCmd.getRemotePathType(path)
        this.unlockEventually(lockingString, lockResult)

        if ( result === false ) return { state: 'error', error: 'unable to get path type'}
        return { state: 'success', result: result }
    }

    async ls(remotepath = '', inputOptions?:Partial<MegaCmdLsOptions>):Promise<StorageMegaMethodResponse<MegaCmdFile>> {
        const lockingString = `storage ${ this.email } ls`
        const lockResult = await this.getMegaCmdAndLogin(lockingString)
        if (!StorageMega.isLockAndLoginOk(lockResult)) return StorageMega.errorResponseForLockAndLogin(lockResult)
        const megaCmd = this.megaCmd!

        const result = await megaCmd.ls(remotepath, inputOptions)
        this.unlockEventually(lockingString, lockResult)

        const response = {
            state: result.state,
            error: result.error,
            result: result.file
        }
        
        return response
    }

    async isFileOk(remotepath:string, expectedBytes:number, inputOptions?:Partial<StorageMegaIsFileOkOptions>):Promise< StorageMegaMethodResponse <StorageMegaIsFileOkResult> > {
        if (!expectedBytes) return { state: 'error', error: 'expectedBytes cannot be 0' }
        const options = _.defaults(inputOptions, {toleranceBytesPercentage: .05})
        const lsResult = await this.ls(remotepath, {recursive: true})
        if (lsResult.state === 'error') return { state: 'error', error: lsResult.error }
        if (!lsResult.result) return {state: 'success', result: { isOk: false, message: 'file not found', remoteBytes: 0 } }

        const file = lsResult.result as MegaCmdFile
        if (!file.bytes) return { state: 'error', error: 'no bytes in file' }
        const byteDiff = Math.abs(file.bytes - expectedBytes) / expectedBytes
        if (byteDiff > options.toleranceBytesPercentage) return {state: 'success', result: { isOk: false, message: 'file size too different', remoteBytes: file.bytes } }
        return {state: 'success', result: { isOk: true, remoteBytes: file.bytes } }
    }

    async upload(localpath:string | string[], remotepath = '', inputOptions?:Partial<StorageMegaUploadOptions>):Promise< StorageMegaMethodResponse <StorageMegaTransferResult> > {
        const options = _.defaults(inputOptions, { allowOverwrite: false, deleteOriginal: false })
        const lockingString = `storage ${ this.email } upload`
        const lockResult = await this.getMegaCmdAndLogin(lockingString)
        if (!StorageMega.isLockAndLoginOk(lockResult)) return StorageMega.errorResponseForLockAndLogin(lockResult)
        const megaCmd = this.megaCmd!
        let responseState = 'success' as 'success' | 'error'
        const result:StorageMegaTransferResult = {
            direction: 'upload',
            totalBytes: 0,
            transfers: []
        }

        const setError = (error:string) => {
            this.unlockEventually(lockingString, lockResult)
            return { state: 'error' as "success" | "error", error: error }
        }

        const filesToUpload = options.transfers ? options.transfers : await megaCmd.put2transfers(localpath, remotepath)
        if (!filesToUpload) return setError('unable to determinate transfers during upload')

        if (filesToUpload.transfers.length === 0) {
            this.unlockEventually(lockingString, lockResult)
            this.consoleLog.warn(`no files to upload with localpath: ${ localpath }`)
            return { state: 'error', result: result }
        }

        if (!options.allowOverwrite) {
            if (filesToUpload.transfers.length > 1) {
                // TODO
                throw new Error('allowOverwrite on multiple files not implemented: should match ls with list of transfers')
            } else {
                const remotepath = filesToUpload.transfers[0].destinationPath
                const fileTypeResponse = await this.getPathType(remotepath)
                let error = ''
                if (fileTypeResponse.state === 'error') error = fileTypeResponse.error!
                    else if ( fileTypeResponse.result !== 'none' ) error = `overwriting "${ remotepath }" not allowed`
                if (error) return setError( error )
            }
        }

        const dfResult = await this.df({ noLogs: true })
        if (dfResult.error) return setError(dfResult.error)
        if (dfResult.result!.freeBytes <= filesToUpload.totalBytes) return setError('not enough space')

        // go!
        const cmdResult = await megaCmd.put(localpath, remotepath, options)
        if (!cmdResult) {
            let error = 'error in megaCmd upload'
            if (megaCmd.getCmdExitCode() === 13) error = 'upload stopped'
             return setError(error)
        }
        
        // check
        for(const fileTransferExpected of filesToUpload.transfers) {
            const localBytes = fileTransferExpected.bytes
            const isFileOkResponse = await this.isFileOk(fileTransferExpected.destinationPath, localBytes)
            if (isFileOkResponse.state === 'error') return setError(isFileOkResponse.error!)
            const isFileOkResult = isFileOkResponse.result!
            result.totalBytes += isFileOkResult.remoteBytes
            const transferResult:StorageMegaTransferFile = {
                sourcePath: fileTransferExpected.sourcePath,
                destinationPath: fileTransferExpected.destinationPath,
                state: isFileOkResult.isOk ? 'success' : 'error',
                error: isFileOkResult.message,
                bytes: isFileOkResult.remoteBytes
            }
            result.transfers.push(transferResult)

            const transferStr = `upload ${ fileTransferExpected.sourcePath } => ${ fileTransferExpected.destinationPath }`
            
            if (!isFileOkResult.isOk) {
                responseState = 'error'
                this.consoleLog.error(transferStr + `: ${ isFileOkResult.message }`)
            }
                else this.consoleLog.debug(transferStr + `: ok!`)

            if (options.deleteOriginal && isFileOkResult.isOk) fs.unlinkSync( fileTransferExpected.sourcePath )
        }

        this.unlockEventually(lockingString, lockResult)
        return { state: responseState, result: result }
    }

    async rm(remotepath:string, inputOptions?:Partial<MegaCmdRmOptions>) {
        const lockingString = `storage ${ this.email } rm`
        const lockResult = await this.getMegaCmdAndLogin(lockingString)
        if (!StorageMega.isLockAndLoginOk(lockResult)) return StorageMega.errorResponseForLockAndLogin(lockResult)
        const megaCmd = this.megaCmd!
        const success = await megaCmd.rm(remotepath, inputOptions)
        return { state: success, error:  success ? '' : megaCmd.getCmdOutput('stdout') }
    }

    static isLockAndLoginOk(lockAndLogin:StorageMegaLockAndLogin) {
        return ['newly locked', 'already locked'].indexOf(lockAndLogin) !== -1
    }

    static errorResponseForLockAndLogin(lockAndLogin:StorageMegaLockAndLogin) {
        return {
            state: 'error' as 'success' | 'error',
            error: lockAndLogin
        }
    }
}