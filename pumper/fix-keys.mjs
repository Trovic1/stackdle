import { secp256k1 } from '@noble/curves/secp256k1';
import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';

// 1. Generate a brand new secure private key
const privateKeyBytes = randomBytes(32);
const privateKeyHex = Buffer.from(privateKeyBytes).toString('hex');

// 2. Get the correct COMPRESSED public key (33 bytes / 66 hex characters)
const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, true);
const publicKeyHex = Buffer.from(publicKeyBytes).toString('hex');

console.log("==================================================");
console.log("🚀 STACKDLE FINAL KEY GENERATOR");
console.log("==================================================");
console.log("\n🔑 YOUR NEW BACKEND_PRIVATE_KEY:");
console.log(privateKeyHex);
console.log("\n(You MUST paste this into Vercel -> Settings -> Environment Variables)");

// 3. Automatically update stackdle.clar with this new public key
const clarPath = path.join(process.cwd(), '..', 'contracts', 'stackdle.clar');
let clarContent = fs.readFileSync(clarPath, 'utf8');
clarContent = clarContent.replace(
  /\(define-constant backend-pubkey 0x[a-fA-F0-9]+\)/,
  `(define-constant backend-pubkey 0x${publicKeyHex})`
);
fs.writeFileSync(clarPath, clarContent);
console.log(`\n✅ Automatically updated stackdle.clar with new public key (0x${publicKeyHex})`);

// 4. Automatically bump the contract version to stackdle-v5 in .env
const envPath = path.join(process.cwd(), '.env');
let envContent = fs.readFileSync(envPath, 'utf8');
envContent = envContent.replace(/CONTRACT_NAME=stackdle-v4/, 'CONTRACT_NAME=stackdle-v5');
fs.writeFileSync(envPath, envContent);
console.log(`✅ Automatically bumped contract version to stackdle-v5 in pumper/.env`);

// 5. Automatically bump the contract version to stackdle-v5 in frontend
const frontendPath = path.join(process.cwd(), '..', 'src', 'app', 'lib', 'contract.ts');
let frontendContent = fs.readFileSync(frontendPath, 'utf8');
frontendContent = frontendContent.replace(/CONTRACT_NAME = 'stackdle-v4'/, "CONTRACT_NAME = 'stackdle-v5'");
fs.writeFileSync(frontendPath, frontendContent);
console.log(`✅ Automatically bumped contract version to stackdle-v5 in frontend (contract.ts)`);

console.log("\n==================================================");
console.log("NEXT STEPS:");
console.log("1. Paste the BACKEND_PRIVATE_KEY above into Vercel and hit Save.");
console.log("2. Run: node deploy.mjs");
console.log("3. Run: node fund.mjs");
console.log("4. Run: cd ..");
console.log("5. Run: vercel --prod");
console.log("==================================================");
