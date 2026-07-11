import fs from 'fs';
import path from 'path';

function scanUpwards(startDir) {
  let currentDir = startDir;
  console.log("🔍 Scanning upwards for any hidden package-lock.json, .package-lock.json, or node_modules...\n");
  
  while (true) {
    console.log(`Checking directory: ${currentDir}`);
    try {
      const items = fs.readdirSync(currentDir);
      
      const targets = ['package-lock.json', '.package-lock.json', 'node_modules'];
      for (const target of targets) {
        const fullPath = path.join(currentDir, target);
        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath);
          console.log(`  🚨 FOUND: "${fullPath}" (${stats.isDirectory() ? 'Directory' : 'File'}, Size: ${stats.size} bytes)`);
          
          if (!stats.isDirectory()) {
            try {
              const content = fs.readFileSync(fullPath);
              console.log(`    First 50 bytes of content:`, Array.from(content.slice(0, 50)));
            } catch (err) {
              console.log(`    (Could not read file: ${err.message})`);
            }
          } else {
            // Check inside node_modules for package-lock
            const innerLock = path.join(fullPath, '.package-lock.json');
            if (fs.existsSync(innerLock)) {
              const innerStats = fs.statSync(innerLock);
              console.log(`    🚨 FOUND INNER LOCK: "${innerLock}" (Size: ${innerStats.size} bytes)`);
              try {
                const content = fs.readFileSync(innerLock);
                console.log(`      First 50 bytes of content:`, Array.from(content.slice(0, 50)));
              } catch (err) {
                console.log(`      (Could not read file: ${err.message})`);
              }
            }
          }
        }
      }
    } catch (err) {
      console.log(`  ⚠️ Error reading directory: ${err.message}`);
    }
    
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }
  console.log("\nScan complete.");
}

scanUpwards('C:\\Users\\BUY-PC COMPUTERS\\celo');
