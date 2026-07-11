import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Guess } from '../hooks/useWordle';

interface WordleBoardProps {
  guesses: Guess[];
  currentGuess: string;
  isShaking: boolean;
}

export function WordleBoard({ guesses, currentGuess, isShaking }: WordleBoardProps) {
  const empties = guesses.length < 6 ? Array.from(Array(5 - guesses.length)) : [];

  return (
    <div className="flex flex-col gap-1.5 sm:gap-2 w-full max-w-[280px] sm:max-w-[320px] mx-auto px-1 sm:px-2">
      {guesses.map((g, i) => (
        <CompletedRow key={i} guess={g.word} evaluations={g.evaluations} />
      ))}
      
      {guesses.length < 6 && (
        <CurrentRow guess={currentGuess} isShaking={isShaking} />
      )}
      
      {empties.map((_, i) => (
        <EmptyRow key={i} />
      ))}
    </div>
  );
}

const variants: Variants = {
  initial: { rotateX: -90, opacity: 0 },
  animate: (i: number) => ({
    rotateX: 0,
    opacity: 1,
    transition: { delay: i * 0.15, duration: 0.5, type: 'spring', bounce: 0.4 }
  }),
};

function CompletedRow({ guess, evaluations }: { guess: string, evaluations: string[] }) {
  const getStyle = (evalStr: string) => {
    if (evalStr === 'correct') return 'bg-wordle-correct border-wordle-correct text-white shadow-[0_0_15px_rgba(255,85,0,0.5)]';
    if (evalStr === 'present') return 'bg-wordle-present border-wordle-present text-white shadow-[0_0_15px_rgba(226,183,20,0.4)]';
    return 'bg-wordle-absent border-wordle-absent text-white/80';
  };

  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {guess.split('').map((char, i) => (
        <motion.div
          key={i}
          custom={i}
          initial="initial"
          animate="animate"
          variants={variants}
          className={`flex items-center justify-center aspect-square text-xl sm:text-2xl md:text-3xl font-black uppercase rounded-lg sm:rounded-xl border-2 ${getStyle(evaluations[i])}`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {char}
        </motion.div>
      ))}
    </div>
  );
}

function CurrentRow({ guess, isShaking }: { guess: string, isShaking: boolean }) {
  const chars = guess.split('');
  const emptyBoxes = Array.from(Array(5 - chars.length));

  return (
    <motion.div 
      className="grid grid-cols-5 gap-1.5 sm:gap-2"
      animate={isShaking ? { x: [-5, 5, -5, 5, 0] } : {}}
      transition={{ duration: 0.4 }}
    >
      {chars.map((char, i) => (
        <motion.div 
          key={i} 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1.1, 1], opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex items-center justify-center aspect-square text-xl sm:text-2xl md:text-3xl font-black uppercase rounded-lg sm:rounded-xl border-2 border-muted-foreground bg-white/5 shadow-inner"
        >
          {char}
        </motion.div>
      ))}
      {emptyBoxes.map((_, i) => (
        <div key={i} className="flex items-center justify-center aspect-square rounded-lg sm:rounded-xl border-2 border-white/10 bg-black/10"></div>
      ))}
    </motion.div>
  );
}

function EmptyRow() {
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {Array.from(Array(5)).map((_, i) => (
        <div key={i} className="flex items-center justify-center aspect-square rounded-lg sm:rounded-xl border-2 border-white/10 bg-black/10"></div>
      ))}
    </div>
  );
}
