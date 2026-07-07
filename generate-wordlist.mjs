/**
 * generate-wordlist.mjs
 * Fetches the complete Wordle valid guesses list from public sources
 * and generates a JSON file for use by the game.
 */
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function fetchWords(url) {
  const res = await fetch(url);
  const text = await res.text();
  return text.split('\n').map(w => w.trim().toLowerCase()).filter(w => /^[a-z]{5}$/.test(w));
}

async function main() {
  console.log('Fetching word lists...');

  // Source 1: tabatkins combined list (~12,900 words)
  const combined = await fetchWords('https://raw.githubusercontent.com/tabatkins/wordle-list/main/words');
  console.log(`  tabatkins: ${combined.length} words`);

  // Source 2: cfreshman answers list (~2,315 words)
  const answers = await fetchWords('https://gist.githubusercontent.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b/raw/wordle-answers-alphabetical.txt');
  console.log(`  cfreshman answers: ${answers.length} words`);

  // Source 3: cfreshman allowed guesses (~10,657 words)
  const allowed = await fetchWords('https://gist.githubusercontent.com/cfreshman/cdcdf777450c5b5301e439061d29694c/raw/wordle-allowed-guesses.txt');
  console.log(`  cfreshman allowed: ${allowed.length} words`);

  // Merge all into a single Set for deduplication
  const allWords = new Set([...combined, ...answers, ...allowed]);
  const sorted = [...allWords].sort();

  console.log(`\nTotal unique valid 5-letter words: ${sorted.length}`);

  // Write the valid guesses JSON
  const outPath = resolve(__dirname, 'src/app/data/valid-guesses.json');
  writeFileSync(outPath, JSON.stringify(sorted));
  console.log(`Written to: ${outPath}`);

  // Write the answers list (curated, for daily word selection)
  const answersSet = new Set(answers);
  const answersSorted = [...answersSet].sort();
  const answersPath = resolve(__dirname, 'src/app/data/answers.json');
  writeFileSync(answersPath, JSON.stringify(answersSorted));
  console.log(`Answers written to: ${answersPath} (${answersSorted.length} words)`);
}

main().catch(console.error);
