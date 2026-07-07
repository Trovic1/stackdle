import { useState, useEffect, useCallback } from 'react';
import { isValidGuess } from '../lib/words';

export type LetterState = 'empty' | 'tbd' | 'correct' | 'present' | 'absent';
export type GameStatus = 'playing' | 'won' | 'lost';

export interface Guess {
  word: string;
  evaluations: LetterState[];
}

const MAX_GUESSES = 6;

export function useWordle() {
  const [token, setToken] = useState<string | null>(null);
  const [gameId, setGameId] = useState<number | null>(null);
  
  const [solution, setSolution] = useState<string>('?????');
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [isShaking, setIsShaking] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [usedKeys, setUsedKeys] = useState<{ [key: string]: LetterState }>({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  const initGame = useCallback(() => {
    fetch('/api/game/new')
      .then(res => res.json())
      .then(data => {
        if (data.token && data.gameId) {
          setToken(data.token);
          setGameId(data.gameId);
        }
      })
      .catch(err => console.error("Failed to fetch new game config:", err));
  }, []);

  // Initialize on mount
  useEffect(() => {
    initGame();
  }, [initGame]);

  const resetGame = useCallback(() => {
    setSolution('?????');
    setGuesses([]);
    setCurrentGuess('');
    setGameStatus('playing');
    setUsedKeys({});
    setToken(null);
    setGameId(null);
    initGame();
  }, [initGame]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2000);
  }, []);

  const shake = useCallback(() => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  }, []);

  const submitGuess = useCallback(async () => {
    if (gameStatus !== 'playing' || isEvaluating || !token) return;
    
    if (currentGuess.length !== 5) {
      shake();
      showToast('Not enough letters');
      return;
    }
    
    if (!isValidGuess(currentGuess)) {
      shake();
      showToast('Not in word list');
      return;
    }
    
    if (guesses.some(g => g.word === currentGuess)) {
      shake();
      showToast('Already guessed');
      return;
    }
    
    setIsEvaluating(true);
    
    try {
      const res = await fetch('/api/game/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          guess: currentGuess,
          token,
          isFinalGuess: guesses.length === MAX_GUESSES - 1
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (data.notInList) {
          shake();
          showToast('Not in word list');
        } else {
          showToast(data.error || 'Error');
        }
        setIsEvaluating(false);
        return;
      }
      
      const evals: LetterState[] = data.evaluations;
      const newGuess = { word: currentGuess, evaluations: evals };
      
      if (data.solution) {
        setSolution(data.solution);
      }
      
      const newGuesses = [...guesses, newGuess];
      setGuesses(newGuesses);
      
      const newUsedKeys = { ...usedKeys };
      for (let i = 0; i < 5; i++) {
        const char = currentGuess[i];
        const currentState = newUsedKeys[char];
        const newState = evals[i];
        
        if (currentState === 'correct') continue;
        if (currentState === 'present' && newState === 'absent') continue;
        newUsedKeys[char] = newState;
      }
      setUsedKeys(newUsedKeys);
      setCurrentGuess('');
      
      const isWin = evals.every(e => e === 'correct');
      if (isWin) {
        setGameStatus('won');
      } else if (newGuesses.length >= MAX_GUESSES) {
        setGameStatus('lost');
      }
    } catch (err) {
      console.error("Failed to evaluate guess:", err);
      showToast('Connection error. Try again.');
    } finally {
      setIsEvaluating(false);
    }
  }, [currentGuess, gameStatus, guesses, usedKeys, isEvaluating, token, shake, showToast]);

  const addLetter = useCallback((letter: string) => {
    if (currentGuess.length < 5 && gameStatus === 'playing' && !isEvaluating) {
      setCurrentGuess(prev => prev + letter.toLowerCase());
    }
  }, [currentGuess, gameStatus, isEvaluating]);

  const removeLetter = useCallback(() => {
    if (currentGuess.length > 0 && gameStatus === 'playing' && !isEvaluating) {
      setCurrentGuess(prev => prev.slice(0, -1));
    }
  }, [currentGuess, gameStatus, isEvaluating]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') submitGuess();
      else if (e.key === 'Backspace') removeLetter();
      else if (/^[a-zA-Z]$/.test(e.key)) addLetter(e.key);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addLetter, removeLetter, submitGuess]);

  return {
    gameId,
    token,
    solution,
    guesses,
    currentGuess,
    gameStatus,
    isShaking,
    toastMessage,
    usedKeys,
    addLetter,
    removeLetter,
    submitGuess,
    resetGame,
    showToast,
    maxGuesses: MAX_GUESSES,
  };
}
