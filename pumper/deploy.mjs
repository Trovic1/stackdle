import { makeContractDeploy, broadcastTransaction } from '@stacks/transactions';
import { generateWallet } from '@stacks/wallet-sdk';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { readFileSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';

async function deployContract() {
  let privateKey = process.env.PRIVATE_KEY;
  const networkStr = process.env.NETWORK || 'testnet';
  const contractName = process.env.CONTRACT_NAME || 'stackdle';
  
  const network = networkStr === 'mainnet' ? new StacksMainnet() : new StacksTestnet();

  if (!privateKey) {
    console.error('❌ Error: PRIVATE_KEY is not defined in pumper/.env');
    process.exit(1);
  }

  // Sanitize the private key: strip quotes, 0x prefix, and whitespace
  privateKey = privateKey.trim().replace(/^["']|["']$/g, '');
  if (privateKey.startsWith('0x')) {
    privateKey = privateKey.slice(2);
  }

  // Check if it's a seed phrase (contains spaces)
  if (privateKey.includes(' ') || privateKey.split(/\s+/).length > 4) {
    console.log('• Mnemonic seed phrase detected. Deriving Stacks private key...');
    try {
      const wallet = await generateWallet({
        secretKey: privateKey,
        password: '',
      });
      privateKey = wallet.accounts[0].stxPrivateKey;
      console.log('✅ Successfully derived private key from mnemonic!');
    } catch (e) {
      console.error('❌ Failed to derive private key from mnemonic:', e.message);
      process.exit(1);
    }
  }

  // Validate the key format
  const isHex = /^[0-9a-fA-F]+$/.test(privateKey);
  const keyLength = privateKey.length;

  console.log(`• Private Key Length: ${keyLength} characters`);
  console.log(`• Private Key is valid Hex: ${isHex}`);

  if (!isHex) {
    console.error('\n❌ Error: The PRIVATE_KEY in your .env contains non-hexadecimal characters.');
    console.error('   Make sure it only contains numbers (0-9) and letters (a-f).');
    process.exit(1);
  }

  if (keyLength !== 64 && keyLength !== 66) {
    console.error('\n❌ Error: Stacks private keys must be exactly 64 or 66 characters long.');
    console.error(`   Your key is ${keyLength} characters long. Please check the key in pumper/.env.`);
    process.exit(1);
  }

  console.log('╔════════════════════════════════════════════╗');
  console.log('║     Stackdle Contract Auto-Deployer        ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`• Network: ${networkStr}`);
  console.log(`• Contract name: ${contractName}`);

  try {
    // 1. Read Clarity code from contracts folder
    const contractPath = join(process.cwd(), '../contracts/stackdle.clar');
    console.log(`• Reading contract file from: ${contractPath}`);
    const codeBody = readFileSync(contractPath, 'utf8');

    // 2. Build deployment transaction
    console.log('• Constructing and signing deploy transaction...');
    const txOptions = {
      contractName,
      codeBody,
      senderKey: privateKey,
      network,
      fee: 25000n, // Set a competitive fee in microSTX (0.025 STX) to speed up deployment
    };

    const transaction = await makeContractDeploy(txOptions);

    // 3. Broadcast to the Stacks node
    console.log('• Broadcasting to Stacks network...');
    
    // We manually broadcast it so we can read the exact plain-text reason the node is rejecting it.
    // The official library crashes trying to JSON.parse the error message.
    const baseUrl = networkStr === 'mainnet' ? 'https://api.hiro.so' : 'https://api.testnet.hiro.so';
    const url = baseUrl + '/v2/transactions';
    const txBytes = transaction.serialize(); // Serialize the transaction we built above
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: txBytes,
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('\n❌ Node rejected the transaction. Here is the raw error from the Stacks Node:');
      console.error(`Status: ${response.status} ${response.statusText}`);
      console.error(`Message: ${responseText}`);
      console.error('\n⚠️ What this means:');
      if (responseText.includes('FeeTooLow')) {
        console.error('  👉 Your fee is too low. Try increasing it in deploy.mjs.');
      } else if (responseText.includes('NotEnoughFunds')) {
        console.error('  👉 You don\'t have enough Testnet STX. You need STX to pay for the deploy fee.');
      } else if (responseText.includes('ContractAlreadyExists') || responseText.includes('ConflictingNonceInMempool')) {
        console.error('  👉 The contract "stackdle" already exists or is pending. Try changing the CONTRACT_NAME in .env.');
      } else {
        console.error('  👉 There is an issue with the transaction or your wallet balance.');
      }
    } else {
      console.log('\n================================================');
      console.log('✅ Contract deploy transaction broadcasted successfully!');
      try {
        const json = JSON.parse(responseText);
        console.log(`• Transaction ID: ${json.txid || json}`);
        console.log(`• View on Explorer: https://explorer.hiro.so/txid/${json.txid || json}?chain=${networkStr}`);
      } catch (e) {
        console.log(`• Transaction Response: ${responseText}`);
      }
      console.log('================================================');
    }
    console.log('💡 Note: It usually takes 1-10 minutes to mine a block on Stacks.');

  } catch (error) {
    console.error('\n❌ Deployment failed:');
    console.error(error);
  }
}

deployContract();
