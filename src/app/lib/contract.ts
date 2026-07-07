export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'ST2Y4P6KXB5PVE20JNM21Z1F2SMT78PT82JGA3XKY';
export const CONTRACT_NAME = process.env.NEXT_PUBLIC_CONTRACT_NAME || 'stackdle-v3';
export const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'testnet';
export const GAME_ID = parseInt(process.env.NEXT_PUBLIC_GAME_ID || '1');

export const getContractId = () => `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;
