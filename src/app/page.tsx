'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useWordle } from './hooks/useWordle';
import { useStacks } from './hooks/useStacks';
import { WordleBoard } from './components/WordleBoard';
import { Keyboard } from './components/Keyboard';
import { WalletButton } from './components/WalletButton';
import { ResultModal } from './components/ResultModal';

const FloatingTiles = () => {
  const tiles = [
    { letter: 'S', color: 'bg-primary text-white', x: '-30vw', y: '-20vh', delay: 0 },
    { letter: 'T', color: 'bg-card text-foreground', x: '35vw', y: '-30vh', delay: 0.5 },
    { letter: 'A', color: 'bg-primary text-white', x: '40vw', y: '25vh', delay: 1 },
    { letter: 'C', color: 'bg-card text-foreground', x: '-40vw', y: '30vh', delay: 1.5 },
    { letter: 'K', color: 'bg-primary text-white', x: '0vw', y: '40vh', delay: 2 },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
      {tiles.map((t, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: t.x, y: t.y }}
          animate={{ 
            opacity: [0.3, 0.6, 0.3], 
            y: [t.y, `calc(${t.y} - 30px)`, t.y],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ 
            opacity: { duration: 5, repeat: Infinity, delay: t.delay },
            y: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: t.delay },
            rotate: { duration: 15, repeat: Infinity, ease: "linear", delay: t.delay }
          }}
          className={`absolute top-1/2 left-1/2 w-16 h-16 rounded-2xl shadow-xl flex items-center justify-center font-bold text-3xl border border-white/10 ${t.color}`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {t.letter}
        </motion.div>
      ))}
    </div>
  );
};

export default function Home() {
  const {
    solution, guesses, currentGuess, gameStatus, isShaking,
    toastMessage, usedKeys, addLetter, removeLetter, submitGuess,
    resetGame, showToast, gameId, token
  } = useWordle();

  const { stxAddress, enterGame, resetTx, isRequestPending, txId } = useStacks();
  
  const [hasEntered, setHasEntered] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('stackdle-theme');
    if (saved === 'light') setIsDark(false);
    
    // Keydown listener for physical keyboard
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing' || !stxAddress || !hasEntered) return;
      if (e.key === 'Enter') submitGuess();
      else if (e.key === 'Backspace') removeLetter();
      else if (/^[A-Za-z]$/.test(e.key)) addLetter(e.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, stxAddress, hasEntered, addLetter, removeLetter, submitGuess]);

  // Apply theme class to HTML
  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    localStorage.setItem('stackdle-theme', !isDark ? 'dark' : 'light');
  };

  const handleEnterGame = () => {
    if (!gameId) return;
    enterGame(gameId, () => {
      setHasEntered(true);
    });
  };

  const gameActive = stxAddress && hasEntered;

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="mesh-bg"></div>
      <FloatingTiles />

      {/* --- Navigation --- */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-50">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-black tracking-tighter"
        >
          STACK<span className="text-primary">DLE</span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <WalletButton />
        </motion.div>
      </nav>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 w-full max-w-7xl mx-auto relative z-10 pb-20">
        
        {/* --- Hero Section (Fades out when playing) --- */}
        <AnimatePresence>
          {!gameActive && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="text-center mb-12"
            >
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight mb-4">
                <span className="text-gradient">Five letters.</span><br/>
                <span className="text-gradient-primary">Six chances.</span>
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl font-medium">
                The definitive Web3 Wordle experience.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Game Terminal Window --- */}
        <motion.div 
          layout
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
          className={`glass-panel rounded-2xl w-full transition-all duration-700 ${
            gameActive ? 'max-w-md' : 'max-w-lg'
          }`}
        >
          {/* Mac Header */}
          <div className="h-12 border-b border-white/10 flex items-center px-4 justify-between bg-white/5 rounded-t-2xl">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <div className="font-mono text-xs font-semibold text-muted-foreground tracking-widest">
              {gameActive ? `GAME_ID: ${gameId || '...'}` : 'STACKDLE_CLI'}
            </div>
            <div className="w-12"></div> {/* Spacer */}
          </div>

          {/* Window Body */}
          <div className="p-6 md:p-8 flex flex-col items-center">
            
            {!stxAddress ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                className="text-center py-8"
              >
                <h2 className="text-2xl font-bold mb-2">Initialize Connection</h2>
                <p className="text-muted-foreground mb-8">Connect your Stacks wallet to verify identity.</p>
                <WalletButton />
              </motion.div>
            ) : !hasEntered ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="w-full"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">Match Found</h2>
                  <p className="text-muted-foreground">Solve today's puzzle to claim the on-chain prize.</p>
                </div>
                
                <div className="bg-black/20 dark:bg-black/40 border border-white/5 rounded-xl p-4 flex justify-between items-center mb-6">
                  <span className="font-medium text-muted-foreground">Entry Fee</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-foreground">0.05</span>
                    <span className="text-primary font-bold text-sm">STX</span>
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(255,85,0,0.3)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleEnterGame}
                  disabled={isRequestPending || !!txId || !gameId}
                >
                  {isRequestPending ? 'Confirming in Wallet...' : 
                   txId ? 'Transaction Submitted...' : 
                   !gameId ? 'Loading Game...' : 'Pay & Enter Game'}
                </motion.button>

                {txId && (
                  <div className="mt-4 text-center">
                    <a href={`https://explorer.hiro.so/txid/${txId}?chain=testnet`} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline">
                      View Transaction
                    </a>
                    <button 
                      onClick={() => setHasEntered(true)} 
                      className="block mx-auto mt-2 text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      Skip Wait
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} 
                className="w-full flex flex-col items-center"
              >
                <WordleBoard 
                  guesses={guesses} 
                  currentGuess={currentGuess} 
                  isShaking={isShaking} 
                />
                <div className="mt-8 w-full max-w-sm">
                  <Keyboard 
                    onKeyPress={(k) => {
                      if (k === 'Enter') submitGuess();
                      else if (k === 'Backspace') removeLetter();
                      else addLetter(k);
                    }} 
                    usedKeys={usedKeys} 
                  />
                </div>
              </motion.div>
            )}

          </div>
        </motion.div>
      </main>

      {/* --- Toasts --- */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[2000]"
          >
            <div className="bg-foreground text-background px-6 py-3 rounded-full font-semibold text-sm shadow-xl">
              {toastMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ResultModal 
        status={gameStatus}
        guesses={guesses}
        solution={solution}
        gameId={gameId}
        token={token}
        onPlayAgain={() => {
          resetGame();
          setHasEntered(false);
          resetTx();
        }}
        showToast={showToast}
      />
    </div>
  );
}
