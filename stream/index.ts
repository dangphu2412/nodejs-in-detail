import { Readable } from 'stream';

/**
 * Stream help us to process data in chunk without loading the whole bunch of data into memory at once
 */
function main() {
    _runReadable();
}

function _runReadable() {
    class CounterStreamReader extends Readable {
        #count = 0;

        _read(size: number) {
            this.push(this.#count.toString());
            if (++this.#count === 5) {
                this.push(null);
            }
        }
    }

    const counterStreamReader = new CounterStreamReader();

    counterStreamReader.on('data', chunk => {
        console.log(chunk.toString())
    });
}

main();
