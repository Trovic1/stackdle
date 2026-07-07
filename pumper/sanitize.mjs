import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const file = join(process.cwd(), '../contracts/stackdle.clar');
const content = readFileSync(file, 'utf8');

// Replace em-dash with hyphen
let safeContent = content.replace(/—/g, '-');
// Replace multiplication with x
safeContent = safeContent.replace(/×/g, 'x');
// Replace checkmark
safeContent = safeContent.replace(/✓/g, '(done)');

// Replace any other non-ASCII character with a space
safeContent = safeContent.replace(/[^\x00-\x7F]/g, ' ');

writeFileSync(file, safeContent, 'utf8');
console.log('Successfully sanitized stackdle.clar!');
