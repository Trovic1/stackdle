import { NextResponse } from 'next/server';
import { secp256k1 } from '@noble/curves/secp256k1';

export async function GET() {
  try {
    const privateKeyHex = process.env.BACKEND_PRIVATE_KEY;
    
    if (!privateKeyHex) {
      return NextResponse.json({ 
        status: "ERROR", 
        message: "BACKEND_PRIVATE_KEY is entirely missing from Vercel" 
      });
    }

    // Attempt to derive the public key the exact same way our code does
    const privKeyBytes = Uint8Array.from(Buffer.from(privateKeyHex.replace('0x', ''), 'hex'));
    
    if (privKeyBytes.length !== 32) {
      return NextResponse.json({ 
        status: "ERROR", 
        message: `Key length is wrong. Expected 32 bytes, got ${privKeyBytes.length} bytes.` 
      });
    }

    const compressed = secp256k1.getPublicKey(privKeyBytes, true);
    const pubKeyHex = '0x' + Buffer.from(compressed).toString('hex');

    return NextResponse.json({ 
      status: "SUCCESS",
      vercel_public_key: pubKeyHex,
      contract_public_key: "0x02cc44a024d36288a607284f55c3ce4d7c4662fc8137defc835696982996fe229f",
      do_they_match: pubKeyHex === "0x02cc44a024d36288a607284f55c3ce4d7c4662fc8137defc835696982996fe229f"
    });

  } catch (error: any) {
    return NextResponse.json({ 
      status: "FATAL ERROR", 
      message: error?.message || String(error)
    });
  }
}
