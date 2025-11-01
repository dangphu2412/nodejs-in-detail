import { createReadStream, createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { createGzip } from 'zlib';

function getPath(name) {
  return join(process.cwd(), 'stream', name);
}

const source = createReadStream(getPath('largefile.txt'));
const gzip = createGzip();
const destination = createWriteStream(getPath('destination-good.txt.gz'));

gzip.pipe(destination);

source.on('data', async (chunk) => {
  const canWrite = gzip.write(chunk);

  // 3. If gzip is full, PAUSE the source stream.
  //    This stops it from reading any more data from the file.
  if (!canWrite) {
    source.pause();
  }
});

gzip.on('drain', () => {
  source.resume();
});

source.on('end', () => {
  gzip.end();
  console.log('Done good script')
});

