import { createReadStream, createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { createGzip } from 'zlib';

function getPath(name) {
  return join(process.cwd(), 'stream', name);
}

const source = createReadStream(getPath('largefile.txt'));
const gzipStream = createGzip();
const destination = createWriteStream(getPath('destination-bad.txt.gz'));

gzipStream.pipe(destination);

source.on('data', (chunk) => {
  // We ignore the return value here, causing the problem
  gzipStream.write(chunk);
});

source.on('end', () => {
  console.log('Bad script finished');
});
