import { execSync } from 'child_process';
import fs from 'fs';

const NUM_COMMITS = 50;
const DUMMY_FILE = 'activity.txt';

console.log(`🚀 Starting ${NUM_COMMITS} GitHub Micro-Commits...`);

// Ensure the dummy file exists
if (!fs.existsSync(DUMMY_FILE)) {
  fs.writeFileSync(DUMMY_FILE, 'GitHub Activity Log\\n');
}

for (let i = 1; i <= NUM_COMMITS; i++) {
  // 1. Modify the file
  fs.appendFileSync(DUMMY_FILE, `Commit ${i} at ${new Date().toISOString()}\\n`);
  
  // 2. Git Add and Commit
  try {
    execSync(`git add ${DUMMY_FILE}`);
    execSync(`git commit -m "Update activity log: chunk ${i}"`);
    console.log(`✅ Created commit ${i}/${NUM_COMMITS}`);
  } catch (err) {
    console.error(`❌ Failed at commit ${i}:`, err.message);
    break;
  }
}

console.log("\\n🎉 All local commits created!");
console.log("Run `git push` to push them all to GitHub at once, or `git push origin main`");
