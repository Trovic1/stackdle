import { secp256k1 } from '@noble/curves/secp256k1';
import { randomBytes } from 'crypto';

const privateKeyBytes = randomBytes(32);
const privateKeyHex = Buffer.from(privateKeyBytes).toString('hex');

// Get compressed public key (starts with 02 or 03, 33 bytes long)
const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, true);
const publicKeyHex = Buffer.from(publicKeyBytes).toString('hex');

console.log("==========================================");
console.log("🚀 MAINNET DEPLOYMENT KEYS GENERATED");
console.log("==========================================");
console.log("\n1. BACKEND_PRIVATE_KEY (Keep Secret! Add to Vercel):");
console.log(privateKeyHex);
console.log("\n2. PUBLIC KEY (Paste into stackdle.clar as backend-pubkey):");
console.log("0x" + publicKeyHex);
console.log("==========================================");
