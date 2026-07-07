import { readFileSync } from 'fs';
import { join } from 'path';

const file = join(process.cwd(), '../contracts/stackdle.clar');
const content = readFileSync(file, 'utf8');

const nonAscii = content.match(/[^\x00-\x7F]/g);
if (nonAscii) {
  console.log('Found non-ASCII characters:', nonAscii);
  process.exit(1);
} else {
  console.log('No non-ASCII characters found! File is clean.');
}
