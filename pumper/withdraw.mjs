import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
} from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import fs from 'fs';
import path from 'path';

async function withdraw() {
  console.log("• Deriving Stacks wallet from mnemonic...");
  
  // Try to load mnemonic from .env or local storage
  const envPath = path.join(process.cwd(), '.env');
  let mnemonic = process.env.PRIVATE_KEY;
  if (!mnemonic && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/PRIVATE_KEY=(.*)/);
    if (match) mnemonic = match[1].trim();
  }
  
  if (!mnemonic) {
    console.error("❌ Could not find PRIVATE_KEY in .env file.");
    process.exit(1);
  }

  const { generateWallet } = await import('@stacks/wallet-sdk');
  const wallet = await generateWallet({ secretKey: mnemonic, password: 'password' });
  const account = wallet.accounts[0];
  const privateKey = account.stxPrivateKey;
  
  const { getAddressFromPrivateKey, TransactionVersion } = await import('@stacks/transactions');
  const senderAddress = getAddressFromPrivateKey(privateKey, TransactionVersion.Mainnet);

  // In v4, we added the withdraw-funds function!
  const contractAddress = senderAddress;
  const contractName = 'stackdle-v4';
  
  // We want to withdraw 1 STX (1,000,000 microSTX)
  // If you also paid an entry fee of 0.05 STX, there might be 1,050,000 STX in there, 
  // but let's just pull out 1,000,000 safely.
  const amountToWithdraw = 1000000; 

  console.log(`• Calling withdraw-funds on ${contractAddress}.${contractName} for ${amountToWithdraw / 1000000} STX...`);

  const txOptions = {
    contractAddress,
    contractName,
    functionName: 'withdraw-funds',
    functionArgs: [uintCV(amountToWithdraw)],
    senderKey: privateKey,
    validateWithAbi: false,
    network: new StacksMainnet(),
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow, // Allow the contract to send STX
  };

  const transaction = await makeContractCall(txOptions);
  
  console.log("• Broadcasting to Stacks network...");
  const broadcastResponse = await broadcastTransaction(transaction, new StacksMainnet());
  
  if (broadcastResponse.error) {
    console.error("❌ Failed to broadcast:", broadcastResponse.error);
    console.error(broadcastResponse.reason);
  } else {
    console.log("✅ Successfully broadcast withdrawal!");
    console.log(`• TXID: ${broadcastResponse.txid}`);
    console.log(`• View on Explorer: https://explorer.hiro.so/txid/${broadcastResponse.txid}?chain=mainnet`);
  }
}

withdraw().catch(console.error);
