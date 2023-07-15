/***
 * This file is intended to be an integration test
 * if you want to skip "username" and "password" evertime you can edit config.template.json
 * and rename it into "config.json"
 */
import { getKeypress, question } from '@winkgroup/misc/dist/node';
import fs from 'fs';
import util from 'util';
import MegaCmd from '../src';
import StorageMega from '../src/storage';
import cliProgress from 'cli-progress';
import EventEmitter from 'node:events';
import {
    StorageMegaMethodResponse,
    StorageMegaTransferResult,
} from '../src/common';

async function main() {
    let option = '';
    const mega = await MegaCmd.get();
    if (!mega) throw new Error('something wrong');
    let email = '';
    let password = '';

    if (fs.existsSync('./playground/config.json')) {
        const configStr = fs.readFileSync('./playground/config.json', 'utf-8');
        const config = JSON.parse(configStr);
        await mega.login(config.email, config.password);
        email = config.email;
        password = config.password;
    }

    while (option !== '0') {
        console.info(`
Options:
0. exit
1. login
2. logout
3. df
4. ls
5. put (StorageMega)
6. getProxy
7. setProxy
        `);
        option = await question('Choose: ');

        switch (option) {
            case '1':
                {
                    email = await question('email: ');
                    password = await question('password: ');
                    const loginResult = await mega.login(email, password);
                    console.info('result', loginResult);
                }
                break;
            case '2':
                const logoutResult = await mega.logout();
                console.info('result', logoutResult);
                break;
            case '3':
                const resultDf = await mega.df();
                console.info(resultDf);
                break;
            case '4':
                {
                    const remotepath = await question('remotepath: ');
                    let usePcreStr = await question('usePcre[y/N]: ');
                    let recursiveStr = await question('recursive[y/N]: ');
                    const resultLs = await mega.ls(remotepath, {
                        usePcre: usePcreStr === 'y',
                        recursive: recursiveStr === 'y',
                    });
                    console.info(
                        util.inspect(resultLs, { depth: 20, colors: true }),
                    );
                }

                break;
            case '5':
                {
                    const localpath = await question('localpath: ');
                    const remotepath = await question('remotepath: ');
                    const storage = new StorageMega({
                        email: email,
                        password: password,
                    });
                    storage.megaCmd = mega;
                    console.info(`
Upload commands:
p = pause
r = resume
s = stop                    
                    `);

                    const bar = new cliProgress.SingleBar({});
                    const eventEmitter = new EventEmitter();

                    eventEmitter.on(
                        'started',
                        (info: { totalBytes: number }) => {
                            bar.start(info.totalBytes, 0);
                        },
                    );

                    eventEmitter.on('progress', (info: { bytes: number }) =>
                        bar.update(info.bytes),
                    );

                    const uploader = () =>
                        new Promise<
                            StorageMegaMethodResponse<StorageMegaTransferResult>
                        >(async (resolve) => {
                            let ended = false;
                            storage
                                .upload(localpath, remotepath, {
                                    onProgress: eventEmitter,
                                })
                                .then((result) => {
                                    ended = true;
                                    resolve(result);
                                });
                            while (!ended) {
                                const key = await getKeypress();
                                if (ended) break;
                                if (key === 's') eventEmitter.emit('stop');
                                if (key === 'p') eventEmitter.emit('pause');
                                if (key === 'r') eventEmitter.emit('resume');
                            }
                        });
                    const result = await uploader();
                    bar.stop();
                    console.log(
                        util.inspect(result, { depth: 20, colors: true }),
                    );
                }
                break;
            case '6':
                {
                    const result = await MegaCmd.getProxy();
                    console.log(result);
                }
                break;
            case '7':
                {
                    const remotepath = await question(
                        'proxy to set (special: "none" | "auto"): ',
                    );
                    await MegaCmd.setProxy(remotepath);
                }
                break;
        }
    }
    process.exit();
}

main();
