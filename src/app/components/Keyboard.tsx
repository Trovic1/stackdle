import React from 'react';
import { motion } from 'framer-motion';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  usedKeys: Record<string, string>;
}

export function Keyboard({ onKeyPress, usedKeys }: KeyboardProps) {
  const rows = [
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l'],
    ['Enter','z','x','c','v','b','n','m','Backspace']
  ];

  const getKeyStyle = (key: string) => {
    const status = usedKeys[key.toLowerCase()];
    if (status === 'correct') return 'bg-wordle-correct text-white border-transparent shadow-[0_0_10px_rgba(255,85,0,0.5)]';
    if (status === 'present') return 'bg-wordle-present text-white border-transparent shadow-[0_0_10px_rgba(226,183,20,0.4)]';
    if (status === 'absent') return 'bg-wordle-absent text-white/50 border-transparent';
    return 'bg-white/10 dark:bg-black/20 text-foreground border border-white/10 hover:bg-white/20 dark:hover:bg-white/10 shadow-sm';
  };

  return (
    <div className="w-full flex flex-col items-center gap-2 touch-manipulation">
      {rows.map((row, i) => (
        <div key={i} className="flex justify-center gap-1 sm:gap-1.5 w-full px-1">
          {row.map(key => {
            const isWide = key === 'Enter' || key === 'Backspace';
            
            return (
              <motion.button
                key={key}
                whileTap={{ scale: 0.9, y: 2 }}
                onClick={() => onKeyPress(key)}
                className={`
                  flex items-center justify-center rounded-lg font-bold uppercase transition-colors
                  ${isWide ? 'px-2 sm:px-3 py-3 text-[10px] sm:text-xs flex-1 max-w-[65px]' : 'w-[9%] aspect-[2/3] sm:aspect-auto max-w-[42px] sm:h-14 sm:w-11 text-xs sm:text-sm'}
                  ${getKeyStyle(key)}
                `}
                aria-label={key}
              >
                {key === 'Backspace' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>
                ) : (
                  key
                )}
              </motion.button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
