import { makeSTXTokenTransfer, broadcastTransaction } from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { generateSecretKey, generateWallet } from '@stacks/wallet-sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fundContract() {
  const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
  const mnemonicMatch = envFile.match(/PRIVATE_KEY=([^\n\r]+)/);
  
  if (!mnemonicMatch) {
    console.error("❌ Could not find PRIVATE_KEY in pumper/.env");
    process.exit(1);
  }

  const mnemonic = mnemonicMatch[1].trim();
  console.log("• Deriving Stacks wallet from mnemonic...");
  
  const wallet = await generateWallet({
    secretKey: mnemonic,
    password: 'password'
  });
  
  const account = wallet.accounts[0];
  const senderKey = account.stxPrivateKey;
  const networkStr = envFile.match(/NETWORK=([^\n\r]+)/)?.[1]?.trim() || 'testnet';
  const network = networkStr === 'mainnet' ? new StacksMainnet() : new StacksTestnet();
  
  // Read address and name from env or calculate it based on mainnet
  let baseAddress = 'ST2Y4P6KXB5PVE20JNM21Z1F2SMT78PT82JGA3XKY';
  if (networkStr === 'mainnet') {
    // Convert to mainnet SP address equivalent
    baseAddress = 'SP2Y4P6KXB5PVE20JNM21Z1F2SMT78PT82JJFZGF2';
  }
  const contractName = envFile.match(/CONTRACT_NAME=([^\n\r]+)/)?.[1]?.trim() || 'stackdle-v3';
  const contractAddress = `${baseAddress}.${contractName}`;
  const amount = 1000000; // 1 STX (in microSTX)

  console.log(`• Constructing transfer of 1 STX to ${contractAddress} on ${networkStr}...`);
  
  try {
    const txOptions = {
      recipient: contractAddress,
      amount: amount,
      senderKey: senderKey,
      network: network,
      memo: 'Funding prize pool',
    };

    const transaction = await makeSTXTokenTransfer(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, network);
    
    if (broadcastResponse.error) {
      console.error("❌ Transfer failed:", broadcastResponse);
    } else {
      console.log(`✅ Successfully broadcast transfer!`);
      console.log(`• TXID: 0x${broadcastResponse.txid}`);
      console.log(`• View on Explorer: https://explorer.hiro.so/txid/0x${broadcastResponse.txid}?chain=${networkStr}`);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

fundContract();
