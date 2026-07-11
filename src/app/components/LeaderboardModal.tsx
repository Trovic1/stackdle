import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Medal } from 'lucide-react';

interface LeaderboardEntry {
  address: string;
  wins: number;
}

export function LeaderboardModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    
    setLoading(true);
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setLeaderboard(data.leaderboard || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const truncateAddress = (addr: string) => {
    return `${addr.substring(0, 5)}...${addr.substring(addr.length - 4)}`;
  };

  const getRankStyle = (index: number) => {
    if (index === 0) return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500';
    if (index === 1) return 'bg-slate-300/20 border-slate-300/50 text-slate-300';
    if (index === 2) return 'bg-amber-700/20 border-amber-700/50 text-amber-600';
    return 'bg-white/5 border-white/10 text-muted-foreground';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-3">
                <Trophy className="text-yellow-500" size={24} />
                <h2 className="text-2xl font-black tracking-wider">LEADERBOARD</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground animate-pulse">
                  Syncing with Stacks Blockchain...
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-400">
                  {error}
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No wins recorded yet. Be the first!
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {leaderboard.map((player, idx) => (
                    <motion.div 
                      key={player.address}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`flex items-center justify-between p-4 rounded-xl border ${getRankStyle(idx)}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="font-black text-xl w-6">
                          {idx < 3 ? <Medal size={24} /> : `#${idx + 1}`}
                        </div>
                        <div className="font-mono font-bold tracking-tight">
                          {truncateAddress(player.address)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 font-black text-lg">
                        {player.wins} <span className="text-sm opacity-80">WINS</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
