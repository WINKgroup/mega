import { MegaCmd } from '../src/cmd'
import fs from 'fs'

let mega:MegaCmd
let config:{ email: string, password: string, key: string }

beforeAll(async () => {
    if (fs.existsSync('./playground/config.json')) {
        const configStr = fs.readFileSync('./playground/config.json', 'utf-8');
        config = JSON.parse(configStr).test;
        console.warn(`config.json found: warning content in "${ config.email }" mega repo will be deleted`)
        const megaLock = await MegaCmd.get('test mega')
        if (!megaLock) throw new Error('unable to get mega')
        mega = megaLock
    } else {
        throw new Error('please set config.json, check README for further informations')
    }
})

describe('login', () => {
    describe('', () => {
        test('successfully', async () => {
            const result = await mega.login(config.email, config.password)
            expect(result).toBe(true)
        })
    })

    describe('', () => {
        test('wrong credentials', async () => {
            const result = await mega.login('wrong email', 'wrong password')
            expect(result).toBe(false)
        })
    })
})

describe('proxy', () => {
    describe('getProxy with no proxy', () => {
        beforeAll(async () => {
            await MegaCmd.setProxy('none')
        })
        
        test('', async () => {
            const proxyInfo = await MegaCmd.getProxy()
            expect(proxyInfo).toBeNull()
        })
    })

    describe('getProxy with auto proxy', () => {
        beforeAll(async () => {
            await MegaCmd.setProxy('auto')
        })
        
        test('', async () => {
            const proxyInfo = await MegaCmd.getProxy()
            expect(proxyInfo!.type).toBe('AUTO')
        })
    })

    describe('getProxy with custom proxy', () => {
        const url = 'socks5h://127.0.0.1:8080'
        beforeAll(async () => {
            await MegaCmd.setProxy(url)
        })
        
        test('', async () => {
            const proxyInfo = await MegaCmd.getProxy()
            expect(proxyInfo!.type).toBe('CUSTOM')
            expect(proxyInfo!.url).toBe(url)
        })
    })

    describe('setProxy shouldn\'t log when you are setting the same config as before', () => {
        test('', async () => {
            await MegaCmd.setProxy('none')
            const logSpy = jest.spyOn(console, 'info');
            await MegaCmd.setProxy('none')
            expect(logSpy).toHaveBeenCalledTimes(0)
            jest.restoreAllMocks();
        })
    })

    describe('setProxy should log when you are setting a config that is different from before', () => {
        test('', async () => {
            await MegaCmd.setProxy('none')
            const logSpy = jest.spyOn(console, 'info');
            await MegaCmd.setProxy('auto')
            expect(logSpy).toHaveBeenCalledTimes(1)
            jest.restoreAllMocks();
        })
    })
})

afterAll(() => {
    MegaCmd.unlock('test mega')
})