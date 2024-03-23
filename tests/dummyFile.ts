import fs from 'fs';

export default function dummyFile(filePath:string, fileSizeInBytes = 10 * 1024 * 1024 /* 10 Mb */) {
    const stream = fs.createWriteStream(filePath);
    let written = 0;
    const maxSizeChunk = 1024; // Chunk size set to 1KB
    const maxSizeChunkData = Buffer.alloc(maxSizeChunk);

    return new Promise<void>((resolve, reject) => {
        stream.on('finish', () => resolve() );
        stream.on('error', (err) => reject(err) )

        function write() {
            let ok = true;
            while (written < fileSizeInBytes && ok) {
                if (maxSizeChunk > fileSizeInBytes - written) {
                    const data = Buffer.alloc(fileSizeInBytes - written);
                    stream.write(data)
                    written = fileSizeInBytes;
                } else {
                    ok = stream.write(maxSizeChunkData)
                    written += maxSizeChunk;
                }
            }
            if (written < fileSizeInBytes) {
                // Had to stop early, wait for drain to write more
                stream.once('drain', write);
            } else stream.end();
        }

        write();
    })
}