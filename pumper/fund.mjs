import { makeSTXTokenTransfer, broadcastTransaction } from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';
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
  const network = new StacksTestnet();
  
  // Replace with the actual deployed contract address on testnet
  const contractAddress = 'ST2Y4P6KXB5PVE20JNM21Z1F2SMT78PT82JGA3XKY.stackdle-v3'; 
  const amount = 1000000; // 1 STX (in microSTX)

  console.log(`• Constructing transfer of 1 STX to ${contractAddress}...`);
  
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
      console.log(`• View on Explorer: https://explorer.hiro.so/txid/0x${broadcastResponse.txid}?chain=testnet`);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

fundContract();
