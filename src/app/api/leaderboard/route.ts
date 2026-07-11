import { NextResponse } from 'next/server';

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  try {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    // We default to stackdle-v5 since that's what was deployed to mainnet
    const contractName = process.env.NEXT_PUBLIC_CONTRACT_NAME || 'stackdle-v5';
    const network = process.env.NEXT_PUBLIC_NETWORK || 'mainnet';
    
    if (!contractAddress) {
      return NextResponse.json({ error: 'Contract address not configured' }, { status: 500 });
    }

    const apiUrl = network === 'mainnet' 
      ? 'https://api.mainnet.hiro.so' 
      : 'https://api.testnet.hiro.so';

    const fullContractId = `${contractAddress}.${contractName}`;
    
    // Fetch transaction history for our smart contract
    const response = await fetch(
      `${apiUrl}/extended/v1/address/${fullContractId}/transactions?limit=50`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      throw new Error(`Hiro API error: ${response.status}`);
    }

    const data = await response.json();
    const results = data.results || [];

    const winsByPlayer: Record<string, number> = {};

    // Process transactions
    results.forEach((tx: any) => {
      // We only care about successful contract calls to 'claim-win'
      if (
        tx.tx_type === 'contract_call' &&
        tx.tx_status === 'success' &&
        tx.contract_call.function_name === 'claim-win'
      ) {
        const playerAddress = tx.sender_address;
        
        // Count total wins (each win is worth 1 STX, so 1 win = 1 point)
        if (!winsByPlayer[playerAddress]) {
          winsByPlayer[playerAddress] = 0;
        }
        winsByPlayer[playerAddress] += 1;
      }
    });

    // Convert to sorted array
    const leaderboard = Object.entries(winsByPlayer)
      .map(([address, wins]) => ({ address, wins }))
      .sort((a, b) => b.wins - a.wins);

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
