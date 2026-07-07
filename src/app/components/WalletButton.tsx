import React from 'react';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { useStacksAuth } from '../context/StacksContext';

export function WalletButton() {
  const { stxAddress, connectWallet, disconnectWallet } = useStacksAuth();

  if (stxAddress) {
    const truncateAddress = (addr: string) => `${addr.substring(0, 4)}...${addr.substring(addr.length - 4)}`;

    return (
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={disconnectWallet}
        className="flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/30 bg-green-500/5 text-foreground hover:bg-green-500/10 transition-colors shadow-sm"
      >
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </div>
        <span className="font-mono text-sm font-medium">{truncateAddress(stxAddress)}</span>
      </motion.button>
    );
  }

  return (
    <motion.button 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={connectWallet}
      className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/10 bg-white/5 text-foreground hover:bg-white/10 transition-colors shadow-sm font-semibold text-sm"
    >
      <Wallet size={16} />
      Connect Wallet
    </motion.button>
  );
}
