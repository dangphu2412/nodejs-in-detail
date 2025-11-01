import { createReadStream, createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'zlib';

function getPath(name) {
  return join(process.cwd(), 'stream', name);
}

const source = createReadStream(getPath('largefile.txt'));
const gzipStream = createGzip();
const destination = createWriteStream(getPath('destination-good.txt.gz'));

await pipeline(
  source,
  gzipStream,
  destination
);

console.log('Done good script')
