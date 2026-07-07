import { NextResponse } from 'next/server';
import { generateMessageHash, signMessage } from '../../../lib/crypto';
import { createHmac } from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gameId, playerAddress, guesses, token } = body;

    // 1. Basic validation
    if (!playerAddress || !guesses || !Array.isArray(guesses) || !token || !gameId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 2. Verify and decode token
    const privateKey = process.env.BACKEND_PRIVATE_KEY || '0000000000000000000000000000000000000000000000000000000000000001';
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
    }

    const expectedSignature = createHmac('sha256', privateKey).update(payloadB64).digest('base64url');
    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Tampered token' }, { status: 401 });
    }

    const decodedPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    const todaysWord = decodedPayload.word.toLowerCase();
    const tokenGameId = decodedPayload.gameId;

    if (tokenGameId !== gameId) {
      return NextResponse.json({ error: 'Game ID mismatch' }, { status: 400 });
    }

    // 3. Verify they actually won in <= 6 tries
    if (guesses.length > 6) {
      return NextResponse.json({ error: 'Only wins in 6 tries or fewer are eligible for prizes' }, { status: 400 });
    }

    const lastGuess = guesses[guesses.length - 1];
    if (lastGuess.toLowerCase() !== todaysWord.toLowerCase()) {
      return NextResponse.json({ error: 'Final guess does not match solution' }, { status: 400 });
    }

    // 4. Generate Cryptographic Signature (secp256k1)
    const messageHash = generateMessageHash(gameId, playerAddress);
    const sig = signMessage(messageHash, privateKey);

    return NextResponse.json({
      success: true,
      messageHash: '0x' + messageHash.toString('hex'),
      signature: '0x' + sig
    });

  } catch (error: any) {
    console.error('Verify win error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
