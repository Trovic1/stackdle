import { NextResponse } from 'next/server';

export const revalidate = 60; // Cache for 60 seconds

// Hardcoded to mainnet since this is a production leaderboard
// These values never change regardless of environment variables
const MAINNET_CONTRACT_ADDRESS = 'SP2Y4P6KXB5PVE20JNM21Z1F2SMT78PT82JJFZGF2';
const MAINNET_CONTRACT_NAME = 'stackdle-v5';
const HIRO_API = 'https://api.mainnet.hiro.so';

export async function GET() {
  try {
    const fullContractId = `${MAINNET_CONTRACT_ADDRESS}.${MAINNET_CONTRACT_NAME}`;

    // Fetch transaction history for our smart contract from Hiro mainnet API
    const response = await fetch(
      `${HIRO_API}/extended/v1/address/${fullContractId}/transactions?limit=50`,
      {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 60 }
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Hiro API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const results = data.results || [];

    const winsByPlayer: Record<string, number> = {};

    // Only count successful 'claim-win' contract calls
    results.forEach((tx: any) => {
      if (
        tx.tx_type === 'contract_call' &&
        tx.tx_status === 'success' &&
        tx.contract_call?.function_name === 'claim-win'
      ) {
        const playerAddress = tx.sender_address;
        winsByPlayer[playerAddress] = (winsByPlayer[playerAddress] || 0) + 1;
      }
    });

    // Sort by wins descending, return top 10
    const leaderboard = Object.entries(winsByPlayer)
      .map(([address, wins]) => ({ address, wins }))
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 10);

    return NextResponse.json({ leaderboard, total: results.length });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard', details: String(error) }, { status: 500 });
  }
}
