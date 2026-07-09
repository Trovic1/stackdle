import { NextResponse } from 'next/server';
import { getTodaysWord, getGameId } from '../../lib/words';
import { generateMessageHash, signMessage } from '../../lib/crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gameId, playerAddress, guesses } = body;

    // 1. Basic validation
    if (!playerAddress || !guesses || !Array.isArray(guesses)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 2. Validate game ID matches today
    const currentDayId = getGameId();
    if (gameId !== currentDayId) {
      return NextResponse.json({ error: `Game ID mismatch. Expected ${currentDayId}` }, { status: 400 });
    }

    // 3. Verify they actually won in <= 6 tries
    if (guesses.length > 6) {
      return NextResponse.json({ error: 'Only wins in 6 tries or fewer are eligible for prizes' }, { status: 400 });
    }

    const todaysWord = getTodaysWord();
    const lastGuess = guesses[guesses.length - 1];

    if (lastGuess.toLowerCase() !== todaysWord.toLowerCase()) {
      return NextResponse.json({ error: 'Final guess does not match solution' }, { status: 400 });
    }

    // 4. Generate Cryptographic Signature
    const privateKey = process.env.BACKEND_PRIVATE_KEY;
    if (!privateKey) {
      console.error('BACKEND_PRIVATE_KEY not configured on server');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    // Generate hash
    const messageHash = generateMessageHash(gameId, playerAddress);
    
    // Generate 64-byte signature
    const signature = await signMessage(messageHash, privateKey);

    return NextResponse.json({
      success: true,
      messageHash: '0x' + messageHash.toString('hex'),
      signature: '0x' + signature
    });

  } catch (error: any) {
    console.error('Verify win error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
