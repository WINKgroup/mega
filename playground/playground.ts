/***
 * This file is intended to be an integration test
 * if you want to skip "username" and "password" evertime you can edit config.template.json
 * and rename it into "config.json"
 */
import fs from 'fs'
import MegaCmd from '../src'
import { question } from '@winkgroup/misc/build/node'
import util from 'util'

async function main() {
    let option = ''
    const mega = await MegaCmd.get()
    if(!mega) throw new Error('something wrong')

    if (fs.existsSync('./playground/config.json')) {
        const configStr = fs.readFileSync('./playground/config.json', 'utf-8')
        const config = JSON.parse(configStr)
        await mega.login(config.email, config.password)
    }
    
    while(option !== '0') {
        console.info(`
Options:
0. exit
1. login
2. logout
3. df
4. ls
        `)
        option = await question('Choose: ')

        switch (option) {
            case '1':
                const email = await question('email: ')
                const password = await question('password: ')
                const loginResult = await mega.login(email, password)
                console.info('result', loginResult)
                break
            case '2':
                const logoutResult = await mega.logout()
                console.info('result', logoutResult)
                break
            case '3':
                const resultDf = await mega.df()
                console.info(resultDf)
                break
            case '4':
                const remotepath = await question('remotepath: ')
                let usePcreStr = await question('usePcre[y/N]: ')
                let recursiveStr = await question('recursive[y/N]: ')
                const resultLs = await mega.ls(remotepath, {
                    usePcre: usePcreStr === 'y',
                    recursive: recursiveStr === 'y'
                })
                console.info(util.inspect(resultLs, {depth: 20,  colors: true}))
                break
        }
    }
    process.exit()
}

main()