import { NextResponse } from 'next/server';
import { getValidWords } from '../../../lib/server-words';
import { createHmac } from 'crypto';

export async function POST(request: Request) {
  try {
    const { guess, isFinalGuess, token } = await request.json();
    
    if (!guess || typeof guess !== 'string' || !token) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 1. Verify and decode token
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

    // 2. Validate guess
    const guessWord = guess.toLowerCase().trim();
    if (guessWord.length !== 5 || !/^[a-z]{5}$/.test(guessWord)) {
      return NextResponse.json({ error: 'Guess must be exactly 5 letters' }, { status: 400 });
    }

    const validWords = await getValidWords();
    if (!validWords.has(guessWord)) {
      return NextResponse.json({ error: 'Not in word list', notInList: true }, { status: 400 });
    }

    // 3. Evaluate guess
    const answer = todaysWord.split('');
    const guessChars = guessWord.split('');
    
    const evals: string[] = Array(5).fill('absent');
    const remainingAnswer: (string | null)[] = [...answer];

    // PASS 1: Mark GREEN (correct position)
    for (let i = 0; i < 5; i++) {
      if (guessChars[i] === answer[i]) {
        evals[i] = 'correct';
        remainingAnswer[i] = null;
      }
    }

    // PASS 2: Mark YELLOW (present but wrong position) or GRAY (absent)
    for (let i = 0; i < 5; i++) {
      if (evals[i] === 'correct') continue;
      
      const idx = remainingAnswer.indexOf(guessChars[i]);
      if (idx !== -1) {
        evals[i] = 'present';
        remainingAnswer[idx] = null;
      }
    }

    const isWin = evals.every(e => e === 'correct');
    const responsePayload: any = { evaluations: evals };

    // Reveal the word if they won or if it's their final guess
    if (isWin || isFinalGuess) {
      responsePayload.solution = todaysWord;
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('Failed to evaluate guess:', error);
    return NextResponse.json({ error: 'Failed to evaluate guess' }, { status: 400 });
  }
}
