'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { connect as stacksConnect, disconnect as stacksDisconnect, isConnected, getLocalStorage } from '@stacks/connect';

interface StacksContextType {
  stxAddress: string | null;
  connectWallet: () => void;
  disconnectWallet: () => void;
  isConnecting: boolean;
}

const StacksContext = createContext<StacksContextType>({
  stxAddress: null,
  connectWallet: () => {},
  disconnectWallet: () => {},
  isConnecting: false,
});

export function StacksProvider({ children }: { children: React.ReactNode }) {
  const [stxAddress, setStxAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Restore existing connection on page load
  useEffect(() => {
    try {
      if (isConnected()) {
        const data = getLocalStorage();
        const addr = data?.addresses?.stx?.[0]?.address;
        if (addr) setStxAddress(addr);
      }
    } catch (e) {
      console.warn('[Stackdle] Failed to restore connection:', e);
    }
  }, []);

  const connectWallet = useCallback(() => {
    setIsConnecting(true);
    stacksConnect({ network: 'testnet' })
      .then((result: any) => {
        // Find the STX address from the result
        const addresses = result?.addresses || [];
        const stxAddr = addresses.find(
          (a: any) => a?.address?.startsWith('S') || a?.symbol === 'STX'
        );
        if (stxAddr) {
          setStxAddress(stxAddr.address);
        } else {
          // Fallback: check localStorage where @stacks/connect stores it
          const data = getLocalStorage();
          const addr = data?.addresses?.stx?.[0]?.address;
          if (addr) setStxAddress(addr);
        }
        setIsConnecting(false);
      })
      .catch((err: any) => {
        console.log('[Stackdle] Auth cancelled or failed:', err);
        setIsConnecting(false);
      });
  }, []);

  const disconnectWallet = useCallback(() => {
    stacksDisconnect();
    setStxAddress(null);
  }, []);

  return (
    <StacksContext.Provider value={{ stxAddress, connectWallet, disconnectWallet, isConnecting }}>
      {children}
    </StacksContext.Provider>
  );
}

export function useStacksAuth() {
  return useContext(StacksContext);
}
