export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ''; // Must be configured on Vercel
export const CONTRACT_NAME = 'stackdle-v5';
export const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'mainnet';
export const GAME_ID = parseInt(process.env.NEXT_PUBLIC_GAME_ID || '1');

export const getContractId = () => `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;
