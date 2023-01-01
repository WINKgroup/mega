# mega
Library for mega.nz. It suppose you have mega-cmd installed and available from any directory.

It provides two main classes:
- **MegaCmd**: a wrapper for mega terminal commands
- **StorageMega**: an abstraction to manage mega repository as a storage

## Install
```
npm install @winkgroup/mega
```

## MegaCmd
This is basically a wrapper for mega-* commands. Mapped commands are:
- df 
- get
- login
- logout
- ls
- proxy
- put
- rm
- whoAmI
for further explanation you can run mega-help

Since you can be logged only with one account a time, a locking system is provided to avoid to have multiple instances of MegaCmd running at the same time.
Here an example to get a megaCmd instance:
```js
    let megaCmd = await MegaCmd.get('myLockingWord') // returns instance of MegaCmd
    let megaCmd2 = await MegaCmd.get('someOtherWord') // returns null
    MegaCmd.unlock('myLockingWord')
    megaCmd2 = await MegaCmd.get('someOtherWord')// now returns instance of MegaCmd

    const booleanResult = await megaCmd2.login('user@mail.com', 'myPassword')
    if (booleanResult) {
        const result = megaCmd2.df()
        console.log(result) // free bytes, etc...
    }
    megaCmd2.unlock('someOtherWord')
```

You can also decide to wait until megaCmd is available again and eventually set a timeout (*default 1 hour*).
In this example it will return an instance of megaCmd as soon as megaCmd is available or will wait 10 minutes for it:
```js
    const megaCmd = await MegaCmd.getOrWait('anyLockingWord', 600)
```
**you can avoid the timeout setting the second param to 0**

You can check by yourself if megaCmd is idle using `MegaCmd.isIdle()`: it will check if you are online and no other megaCmd instance locked the resource.

You can also subscribe the idle event that will be fired when you will be online and no other megaCmd have locked the resource. This method uses [EventQueue](https://github.com/WINKgroup/event-queue) library, this means you don't need to remove the listener when is fired and any listener is fired in sequence so the is unlikely that when the callback is fired you will need to wait any longer. Here an example:
```js
    const handle = MegaCmd.onIdle.add(() => {
        console.log('put here some code has to run when MegaCmd is in idle state')
        ...
    })

    ...
    // later on if you need to delete the listener of any reason:
    MegaCmd.onIdle.remove(handle)
```

### get and put commands
These two commands can manage also the progress during the transfer providing an EventEmitter instance, here and example:
```js

    const megaCmd = await MegaCmd.get('myLockingWord')
    const onTransfer = new EventEmitter()
    onTransfer.on('progress', (data) => {
        console.log(`${ data.bytes } of ${ data.totalBytes } (${ data.percentage}%) transferred`)
    })
    await megaCmd.login('user@mail.com', 'myPassword')
    await megaCmd.get('myRemoteFilePath', 'localPath', { onTransfer: onTransfer }) // this will output the progress during the transfer session
    ...
```

## Maintainers
* [fairsayan](https://github.com/fairsayan)