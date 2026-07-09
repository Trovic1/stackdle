import { useState, useCallback } from 'react';
import { openContractCall } from '@stacks/connect';
import { Cl, PostConditionMode } from '@stacks/transactions';
import { useStacksAuth } from '../context/StacksContext';
import { CONTRACT_ADDRESS, CONTRACT_NAME, NETWORK } from '../lib/contract';

export function useStacks() {
  const { stxAddress } = useStacksAuth();
  const [entryTxId, setEntryTxId] = useState<string | null>(null);
  const [claimTxId, setClaimTxId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const resetTx = useCallback(() => {
    setEntryTxId(null);
    setClaimTxId(null);
    setIsPending(false);
  }, []);

  const enterGame = useCallback((gameId: number, onFinish?: (txId: string) => void) => {
    if (!stxAddress) return;
    setIsPending(true);

    openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'enter-game',
      functionArgs: [Cl.uint(gameId)],
      network: NETWORK as any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        setEntryTxId(data.txId);
        setIsPending(false);
        if (onFinish) onFinish(data.txId);
      },
      onCancel: (err) => {
        setIsPending(false);
        console.log('[Stackdle] Transaction cancelled:', err);
      },
    });
  }, [stxAddress]);

  const claimWin = useCallback((gameId: number, messageHashHex: string, signatureHex: string, onFinish?: (txId: string) => void) => {
    if (!stxAddress) return;
    setIsPending(true);

    const msgHashBuffer = new Uint8Array(Buffer.from(messageHashHex.replace('0x', ''), 'hex'));
    const sigBuffer = new Uint8Array(Buffer.from(signatureHex.replace('0x', ''), 'hex'));

    openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'claim-win',
      functionArgs: [
        Cl.uint(gameId),
        Cl.buffer(msgHashBuffer),
        Cl.buffer(sigBuffer),
      ],
      network: NETWORK as any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        setClaimTxId(data.txId);
        setIsPending(false);
        if (onFinish) onFinish(data.txId);
      },
      onCancel: (err) => {
        setIsPending(false);
        console.log('[Stackdle] Claim cancelled:', err);
      },
    });
  }, [stxAddress]);

  return {
    enterGame,
    claimWin,
    resetTx,
    stxAddress,
    isRequestPending: isPending,
    entryTxId,
    claimTxId,
  };
}
