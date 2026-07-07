import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { GameStatus, Guess } from '../hooks/useWordle';
import { useStacks } from '../hooks/useStacks';

interface ResultModalProps {
  status: GameStatus;
  guesses: Guess[];
  solution: string;
  gameId: number | null;
  token?: string | null;
  onPlayAgain?: () => void;
  showToast?: (msg: string) => void;
}

async function generateShareImage(
  guesses: Guess[],
  solution: string,
  gameId: number | null,
  won: boolean
): Promise<string> {
  const tileSize = 56;
  const gap = 8;
  const cols = 5;
  const rows = guesses.length;
  const paddingX = 48;
  const paddingY = 48;
  const headerH = 100;
  const footerH = 50;
  
  const boardW = cols * tileSize + (cols - 1) * gap;
  const boardH = rows * tileSize + (rows - 1) * gap;
  const canvasW = boardW + paddingX * 2;
  const canvasH = headerH + boardH + footerH + paddingY * 2;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW * 2;   // 2x for retina
  canvas.height = canvasH * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);
  
  const centerX = canvasW / 2;

  // --- Background ---
  ctx.fillStyle = '#0a0a0f';
  roundRect(ctx, 0, 0, canvasW, canvasH, 24);
  ctx.fill();

  // Orange radial glow behind the grid
  const gridCenterY = paddingY + headerH + boardH / 2;
  const glow = ctx.createRadialGradient(centerX, gridCenterY, 0, centerX, gridCenterY, canvasW * 0.8);
  glow.addColorStop(0, 'rgba(255, 85, 0, 0.15)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  roundRect(ctx, 0, 0, canvasW, canvasH, 24);
  ctx.fill();

  // Thin orange border
  ctx.strokeStyle = 'rgba(255, 85, 0, 0.25)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 1, 1, canvasW - 2, canvasH - 2, 24);
  ctx.stroke();

  // --- Header ---
  ctx.font = '900 32px Inter, -apple-system, sans-serif';
  const stackW = ctx.measureText('STACK').width;
  const dleW = ctx.measureText('DLE').width;
  const totalLogoW = stackW + dleW;
  const logoStartX = centerX - totalLogoW / 2;
  
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('STACK', logoStartX, paddingY + 40);
  ctx.fillStyle = '#FF5500';
  ctx.fillText('DLE', logoStartX + stackW, paddingY + 40);

  // Metadata line
  ctx.font = '600 13px Inter, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.textAlign = 'center';
  ctx.fillText(`Word #${gameId ?? 'Random'}  •  ${won ? rows : 'X'}/6`, centerX, paddingY + 70);

  // --- Tiles ---
  const startX = centerX - boardW / 2;
  const startY = paddingY + headerH;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 5; c++) {
      const x = startX + c * (tileSize + gap);
      const y = startY + r * (tileSize + gap);
      const ev = guesses[r].evaluations[c];
      const letter = guesses[r].word[c]?.toUpperCase() ?? '';

      // Tile fill
      let fill = '#18181b';
      if (ev === 'correct') fill = '#FF5500';
      else if (ev === 'present') fill = '#e2b714';
      else if (ev === 'absent') fill = '#27272a';

      ctx.fillStyle = fill;
      roundRect(ctx, x, y, tileSize, tileSize, 12);
      ctx.fill();

      // Glass shine for colored tiles
      if (ev === 'correct' || ev === 'present') {
        const shine = ctx.createLinearGradient(x, y, x, y + tileSize);
        shine.addColorStop(0, 'rgba(255,255,255,0.25)');
        shine.addColorStop(0.5, 'rgba(255,255,255,0)');
        ctx.fillStyle = shine;
        roundRect(ctx, x, y, tileSize, tileSize, 12);
        ctx.fill();
      } else {
        // subtle border for empty/absent
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        roundRect(ctx, x, y, tileSize, tileSize, 12);
        ctx.stroke();
      }

      // Letter
      ctx.font = 'bold 28px Inter, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter, x + tileSize / 2, y + tileSize / 2 + 2);
    }
  }

  // --- Footer ---
  const footerY = startY + boardH + (footerH / 2) + 10;
  ctx.font = '600 13px Inter, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('stackdle.app', centerX, footerY);

  return canvas.toDataURL('image/png');
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function ResultModal({ status, guesses, solution, gameId, token, onPlayAgain, showToast }: ResultModalProps) {
  const { stxAddress, claimWin, isRequestPending, txId } = useStacks();
  const [isVerifying, setIsVerifying] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const won = status === 'won';
  const eligibleForPrize = won && guesses.length <= 6;

  // Confetti on win
  useEffect(() => {
    if (won) {
      const end = Date.now() + 3000;
      const frame = () => {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#FF5500', '#e2b714', '#ffffff'] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#FF5500', '#e2b714', '#ffffff'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [won]);

  if (status === 'playing') return null;

  const handleShare = async () => {
    setIsGenerating(true);
    try {
      const imgUrl = await generateShareImage(guesses, solution, gameId, won);
      setShareImageUrl(imgUrl);
    } catch (e) {
      // Fallback: copy text
      const url = 'stackdle.app';
      const emojiGrid = guesses.map(g =>
        g.evaluations.map(e => e === 'correct' ? '🟧' : e === 'present' ? '🟨' : '⬛').join('')
      ).join('\n');
      navigator.clipboard.writeText(`Stackdle #${gameId ?? 'Random'} ${won ? guesses.length : 'X'}/6\n\n${emojiGrid}\n\nPlay: ${url}`);
      if (showToast) showToast('Result copied to clipboard!');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadShare = () => {
    if (!shareImageUrl) return;
    const a = document.createElement('a');
    a.href = shareImageUrl;
    a.download = `stackdle-${gameId ?? 'result'}.png`;
    a.click();
    if (showToast) showToast('Screenshot saved!');
  };

  const handleCopyShareText = () => {
    const url = 'stackdle.app';
    const emojiGrid = guesses.map(g =>
      g.evaluations.map(e => e === 'correct' ? '🟧' : e === 'present' ? '🟨' : '⬛').join('')
    ).join('\n');
    navigator.clipboard.writeText(`Stackdle #${gameId ?? 'Random'} ${won ? guesses.length : 'X'}/6\n\n${emojiGrid}\n\nPlay: ${url}`);
    if (showToast) showToast('Copied to clipboard!');
  };

  const handleClaim = async () => {
    if (!stxAddress) return;
    setIsVerifying(true);
    setClaimError('');
    try {
      const res = await fetch('/api/game/verify-win', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, playerAddress: stxAddress, guesses: guesses.map(g => g.word), token })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      if (!gameId) throw new Error('No Game ID found');
      await claimWin(gameId, data.messageHash, data.signature);
    } catch (err: any) {
      setClaimError(err.message || 'Failed to claim');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Share Image Preview */}
        <AnimatePresence>
          {shareImageUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="relative z-[2000] flex flex-col items-center gap-4"
            >
              <img src={shareImageUrl} alt="Share result" className="rounded-2xl shadow-2xl max-w-xs w-full" />
              <div className="flex gap-3">
                <button
                  onClick={handleDownloadShare}
                  className="px-5 py-2.5 bg-primary hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  Save Image
                </button>
                <button
                  onClick={handleCopyShareText}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-sm border border-white/10 transition-colors"
                >
                  Copy Text
                </button>
                <button
                  onClick={() => setShareImageUrl(null)}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-sm border border-white/10 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Modal */}
        {!shareImageUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm glass-panel p-8 rounded-3xl text-center shadow-2xl"
          >
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-primary/20 blur-3xl rounded-full pointer-events-none"></div>

            <h2 className="text-4xl font-black mb-2 tracking-tight relative z-10" style={{ color: 'var(--foreground)' }}>
              {won ? '🎉 Splendid!' : 'Game Over'}
            </h2>
            <p className="text-sm mb-6 relative z-10" style={{ color: 'var(--muted-foreground)' }}>
              {won ? (
                <>Solved in <strong style={{ color: 'var(--foreground)' }}>{guesses.length}</strong> tries.</>
              ) : (
                <>The word was <strong style={{ color: '#FF5500' }} className="uppercase tracking-widest">{solution}</strong></>
              )}
            </p>

            {/* Emoji grid preview */}
            <div className="flex flex-col gap-1 items-center mb-6 bg-black/20 p-4 rounded-2xl border border-white/5 relative z-10">
              {guesses.map((g, i) => (
                <div key={i} className="tracking-[0.2em] text-lg leading-relaxed">
                  {g.evaluations.map((e, j) => (
                    <span key={j}>{e === 'correct' ? '🟧' : e === 'present' ? '🟨' : '⬛'}</span>
                  ))}
                </div>
              ))}
            </div>

            {eligibleForPrize && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 relative z-10"
                style={{ background: 'rgba(255,85,0,0.1)', border: '1px solid rgba(255,85,0,0.2)', color: '#FF5500' }}>
                🏆 Eligible for On-Chain Prize
              </div>
            )}

            <div className="flex flex-col gap-3 relative z-10">
              <button
                onClick={handleShare}
                disabled={isGenerating}
                className="w-full py-3.5 rounded-xl font-semibold transition-colors text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--foreground)' }}
              >
                {isGenerating ? 'Generating...' : '📸 Share Result'}
              </button>

              {eligibleForPrize && (
                <button
                  onClick={handleClaim}
                  disabled={isRequestPending || isVerifying || !!txId || !stxAddress}
                  className="w-full py-3.5 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  style={{ background: '#FF5500', boxShadow: '0 0 20px rgba(255,85,0,0.3)' }}
                >
                  {isVerifying ? 'Verifying...' :
                    isRequestPending ? 'Confirming...' :
                      txId ? '✓ Claim Submitted!' :
                        !stxAddress ? 'Connect Wallet to Claim' :
                          'Claim Win On-Chain'}
                </button>
              )}

              {onPlayAgain && (
                <button
                  onClick={onPlayAgain}
                  className="w-full py-3.5 rounded-xl font-semibold transition-colors mt-1 text-sm"
                  style={{ border: '1px solid rgba(255,85,0,0.5)', color: '#FF5500', background: 'transparent' }}
                >
                  ↩ Play Again
                </button>
              )}
            </div>

            {claimError && (
              <p className="text-red-400 text-xs mt-4 font-medium relative z-10">{claimError}</p>
            )}
            {txId && (
              <div className="mt-4 text-xs relative z-10" style={{ color: 'var(--muted-foreground)' }}>
                <a href={`https://explorer.hiro.so/txid/${txId}?chain=testnet`} target="_blank" rel="noreferrer" className="hover:underline" style={{ color: '#FF5500' }}>
                  View on Explorer →
                </a>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
