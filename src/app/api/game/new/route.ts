import { NextResponse } from 'next/server';
import { ANSWERS } from '../../../lib/words';
import { createHmac, randomBytes } from 'crypto';

export async function GET() {
  try {
    // 1. Pick a random word from the ANSWERS array
    const randomIndex = Math.floor(Math.random() * ANSWERS.length);
    const word = ANSWERS[randomIndex];

    // 2. Generate a random game ID (positive uint up to 2^31 to match Clarity uints safely)
    const gameId = Math.floor(Math.random() * 2000000000) + 1;

    // 3. Create a stateless token containing the secret word
    const privateKey = process.env.BACKEND_PRIVATE_KEY;
  if (!privateKey) {
    console.error("FATAL: BACKEND_PRIVATE_KEY is not set in Vercel Environment Variables!");
    return NextResponse.json({ error: 'Backend configuration error: Private key missing' }, { status: 500 });
  }
    
    const payload = Buffer.from(JSON.stringify({ word, gameId })).toString('base64url');
    const signature = createHmac('sha256', privateKey).update(payload).digest('base64url');
    
    const token = `${payload}.${signature}`;

    return NextResponse.json({
      gameId,
      token,
      maxGuesses: 6,
    });
  } catch (error) {
    console.error('Failed to start new game:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
