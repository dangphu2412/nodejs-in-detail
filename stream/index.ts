import { Readable, Transform, Writable } from 'node:stream';
import { once } from 'node:events';
import { createReadStream, createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import { chain } from 'stream-chain';

function _runReadable() {
    class CounterStreamReader extends Readable {
        #count = 0;

        _read(size: number) {
            this.push(this.#count.toString());
            if (++this.#count === 5) {
                return this.push(null);
            }
        }
    }

    const counterStreamReader = new CounterStreamReader({highWaterMark: 1});

    /**
     * This event is fired data available to read from the stream
     * or 
     * when the end of the stream has been reached.
     * It allows for more controlled data reading when needed.
     * 
     * Adding a 'readable' event handler automatically makes the stream stop flowing,
     * and the data has to be consumed via readable.read(). 
     * If the 'readable' event handler is removed, then the stream will start flowing again if there is a 'data' event handler.
     * https://github.com/nodejs/readable-stream/blob/main/lib/internal/streams/readable.js
     * 
     * emitReadable is triggered after each push can see in NODE_DEBUG=stream
     * 
     * we are in “flow” mode
     * 
     * so the emission is scheduled for the nextTick
     */
    counterStreamReader.on('readable', () => {
        console.count(">> Readable count");

        let batchChunk;
        let chunk;

        while ((chunk = counterStreamReader.read() !== null)) {
            batchChunk += chunk.toString();
        }

        console.log(batchChunk);
    });
    /**
     * No data available to read from the stream
     */
    counterStreamReader.on('end', () => {
        console.log('=== End stream');
    })
    /**
     * underlying resource has been closed
     */
    counterStreamReader.on('close', () => {
        console.log('=== Close stream');
    });
    counterStreamReader.on('error', (err) => {
        console.error('Error stream', err);
    });
}

async function _runWritable() {
    class CounterWriteStream extends Writable {
        constructor() {
            /**
             * If internal buffer is full, writable stream does not receive more input, wait until write to disk, ... success
             * and the internal buffer got release, now the stream emit the event drain
             */
            super({ highWaterMark: 10 /* 10 bytes */ });
        }

        _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
            process.stdout.write(chunk.toString() + '\n', callback);
        }
    }

    const stream = new CounterWriteStream();

    for (let index = 0; index < 10; index++) {
        /**
         * Drain means that the write is buffer into memory and reach the limit of highWaterMark
         */
        const isDraining = !stream.write(index.toString());

        if (isDraining) {
            console.log('Draining ...');
            await once(stream, 'drain');
        }
    }

    stream.end();
}

function _runTransform() {
    const uppercaseTransform = new Transform({
        transform(data, encoding, cb) {
            console.log("==========Start =====")
            const stringData = data.toString();
            for (let index = 0; index < stringData.length; index++) {
                console.log(stringData.charAt(index))
            }
            console.log("==========End =====")
            this.push(data.toString().toUpperCase());
            cb()
        }
    })

    const readStream = createReadStream(join(process.cwd(), 'stream/input.json'), {
        highWaterMark: 10
    });
    const writeStream = createWriteStream(join(process.cwd(), 'stream/output.json'), {
        highWaterMark: 10
    });

    readStream
        .pipe(uppercaseTransform)
        .pipe(writeStream);
}

function _runTransformKeyInObject() {
    let isFirst = true;

    const readStream = createReadStream(join(process.cwd(), 'stream/input.json'), {
        highWaterMark: 5
    });
    const writeStream = createWriteStream(join(process.cwd(), 'stream/output.json'), {
        highWaterMark: 5
    });

    function uppercaseKeys(obj) {
        const newObj = {};

        for (const key in obj) {
            newObj[key.toUpperCase()] = obj[key];
        }

        return newObj;
    }

    const pipelineChain = chain([
        readStream,
        parser(),
        streamArray(),
        new Transform({
            objectMode: true,
            transform({ value }, encoding, cb) {
                const transformed = uppercaseKeys(value);
                const json = JSON.stringify(transformed);

                if (isFirst) {
                    this.push('[' + json);
                    isFirst = false;
                } else {
                    this.push(',' + json);
                }
                cb();
            },
            flush(cb) {
                // Close the JSON array
                this.push(']');
                cb();
            }
        }),
        writeStream
    ]);

    pipelineChain.on('end', () => {
        console.log('Ending....')
    })
}

/**
 * Stream help us to process data in chunk without loading the whole bunch of data into memory at once
 */
function main() {
    // _runReadable();
    // _runWritable();
    // _runTransform();
    _runTransformKeyInObject()
}

main();
