import { Readable, Writable } from 'node:stream';

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

function _runWritable() {
    class CounterWriteStream extends Writable {
        _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
            process.stdout.write(chunk.toString() + '\n', callback);
        }
    }

    const stream = new CounterWriteStream();

    stream.write('1');
    stream.write('2');
    stream.write('3');
    stream.end();
}


/**
 * Stream help us to process data in chunk without loading the whole bunch of data into memory at once
 */
function main() {
    // _runReadable();
    _runWritable();
}

main();
