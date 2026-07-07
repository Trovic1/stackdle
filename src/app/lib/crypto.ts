import { createHash } from 'crypto';

/**
 * Creates a message hash matching what Clarity's secp256k1-verify expects.
 * Clarity expects a 32-byte hash.
 * 
 * We hash: gameId (uint 32-bit LE) + playerAddress + "WIN"
 */
export function generateMessageHash(gameId: number, playerAddress: string): Buffer {
  const gameIdBuf = Buffer.alloc(4);
  gameIdBuf.writeUInt32LE(gameId, 0);
  
  const payload = Buffer.concat([
    gameIdBuf,
    Buffer.from(playerAddress, 'utf8'),
    Buffer.from('WIN', 'utf8')
  ]);
  
  return createHash('sha256').update(payload).digest();
}

/**
 * Signs a 32-byte message hash using the backend private key.
 * Uses Node.js built-in crypto to avoid noble-secp256k1 v2 API changes.
 * Returns a 64-byte (r || s) signature as hex string.
 */
export function signMessage(messageHash: Buffer, privateKeyHex: string): string {
  const secp = require('@noble/secp256k1');
  const crypto = require('crypto');
  
  // Configure noble-secp256k1 for synchronous signing using Node's crypto
  if (!secp.etc.hmacSha256Sync) {
    secp.etc.hmacSha256Sync = (k: Uint8Array, ...m: Uint8Array[]) => {
      const h = crypto.createHmac('sha256', k);
      m.forEach(b => h.update(b));
      return h.digest();
    };
  }
  
  const privKey = Uint8Array.from(Buffer.from(privateKeyHex.replace('0x', ''), 'hex'));
  const msgBytes = Uint8Array.from(messageHash);
  
  const sig = secp.sign(msgBytes, privKey);
  const sigBytes = sig.toCompactRawBytes();
  
  return Buffer.from(sigBytes).toString('hex');
}
