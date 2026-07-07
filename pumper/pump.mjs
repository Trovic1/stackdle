/**
 * ============================================================
 * Stackdle Transaction Pumper v1.0
 * ============================================================
 *
 * Purpose:
 *   Generates on-chain transaction volume for the Stackdle
 *   smart contract deployed on the Stacks blockchain.
 *   Each iteration calls the `enter-game` function, simulating
 *   real player activity so dashboards and explorers reflect
 *   meaningful metrics.
 *
 * Usage:
 *   node pump.mjs [--count N] [--delay N] [--game-id N] [--network testnet|mainnet]
 *
 * Environment:
 *   Copy .env.example → .env and fill in your private key and
 *   contract details before running.
 *
 * Dependencies:
 *   @stacks/transactions – build & broadcast Clarity contract calls
 *   @stacks/network      – (peer dependency) network helpers
 *   dotenv               – load .env vars into process.env
 * ============================================================
 */

/* ── Imports ────────────────────────────────────────────────── */

// `makeContractCall` builds a signed Clarity contract-call transaction.
// `broadcastTransaction` submits the signed transaction to a Stacks node.
// `Cl` is a convenience helper that constructs Clarity values
//   (e.g. Cl.uint(42) creates a Clarity uint for function args).
import {
  makeContractCall,   // Builds a signed contract-call transaction
  broadcastTransaction, // Sends the signed tx bytes to the network
  Cl,                 // Clarity value constructors (uint, int, principal, etc.)
} from '@stacks/transactions';
import { generateWallet } from '@stacks/wallet-sdk';
import { StacksTestnet, StacksMainnet } from '@stacks/network';

// `dotenv/config` reads the `.env` file in the project root and
// injects every KEY=VALUE pair into `process.env` so we can
// reference them below without manual file parsing.
import 'dotenv/config';

/* ── CLI Argument Parser ────────────────────────────────────── */

/**
 * parseArgs()
 *
 * Scans `process.argv` for recognised flags and returns their
 * values.  Any flag not supplied on the command line falls back
 * to the corresponding environment variable from `.env`.
 *
 * Supported flags:
 *   --count   N             Number of transactions to send
 *   --delay   N             Milliseconds to wait between txs
 *   --game-id N             The Stackdle game ID to enter
 *   --network testnet|mainnet  Which Stacks network to target
 *
 * @returns {Object} Parsed configuration values.
 */
function parseArgs() {
  // Grab the raw argument list provided by Node.js.
  // argv[0] = node binary path, argv[1] = script path,
  // argv[2..] = user-supplied arguments.
  const args = process.argv.slice(2); // Remove node + script entries

  // Start with defaults pulled from environment variables.
  // `parseInt` converts the string env value to an integer;
  // the `|| <fallback>` provides a sensible default when the
  // env var is missing or results in NaN.
  const config = {
    count:   parseInt(process.env.TX_COUNT, 10)    || 50,    // How many txs to send
    delay:   parseInt(process.env.TX_DELAY_MS, 10) || 2000,  // Gap between txs (ms)
    gameId:  parseInt(process.env.GAME_ID, 10)     || 1,     // Target game ID
    network: process.env.NETWORK                   || 'testnet', // Network name
  };

  // Walk through the args array two at a time (flag + value).
  for (let i = 0; i < args.length; i++) {
    // Check each recognised flag and grab the next token as its value.
    switch (args[i]) {
      case '--count':   // Override transaction count
        config.count = parseInt(args[++i], 10);  // Pre-increment to consume value
        break;
      case '--delay':   // Override delay between transactions
        config.delay = parseInt(args[++i], 10);
        break;
      case '--game-id': // Override game ID
        config.gameId = parseInt(args[++i], 10);
        break;
      case '--network': // Override network selection
        config.network = args[++i]; // Keep as string ('testnet' or 'mainnet')
        break;
      default:
        // Unknown flag – warn but don't crash so the script is forgiving.
        console.warn(`⚠️  Unknown argument: ${args[i]}`); // Alert the user
    }
  }

  return config; // Return the fully-resolved configuration object
}

/* ── Private Key Masker ─────────────────────────────────────── */

/**
 * maskKey(key)
 *
 * Security helper: replaces all but the last 4 characters of
 * the private key with asterisks so we can log config safely
 * without exposing the full secret.
 *
 * @param {string} key – The raw hex private key.
 * @returns {string} Masked version, e.g. "****************************a1b2"
 */
function maskKey(key) {
  // Guard against undefined/empty keys to prevent runtime errors.
  if (!key || key.length < 4) return '****'; // Fallback if key is too short

  // Slice off everything except the last 4 chars, replace with stars.
  const masked = '*'.repeat(key.length - 4) + key.slice(-4); // Show only tail
  return masked; // Return the safe-to-log representation
}

/* ── Sleep Utility ──────────────────────────────────────────── */

/**
 * sleep(ms)
 *
 * Returns a Promise that resolves after `ms` milliseconds.
 * Used between transactions to avoid flooding the mempool
 * and to respect node rate limits.  Stacks nodes may reject
 * rapid-fire submissions, so pacing is essential.
 *
 * @param {number} ms – Milliseconds to pause.
 * @returns {Promise<void>}
 */
function sleep(ms) {
  // `setTimeout` is callback-based; wrapping it in a Promise
  // lets us use `await sleep(2000)` for cleaner async flow.
  return new Promise((resolve) => setTimeout(resolve, ms)); // Pause execution
}

/* ── Banner Printer ─────────────────────────────────────────── */

/**
 * printBanner()
 *
 * Displays a decorative ASCII box in the terminal so the user
 * immediately knows which tool is running and its version.
 */
function printBanner() {
  // Template literal preserves the exact whitespace of the box.
  // The box-drawing characters (╔ ║ ╚ ═ ╗ ╝) render correctly
  // in most modern terminals (UTF-8).
  console.log(`
╔════════════════════════════════════════════╗
║     Stackdle Transaction Pumper v1.0       ║
║  Generating on-chain volume for metrics    ║
╚════════════════════════════════════════════╝
`); // Newlines above and below keep the banner visually separated
}

/* ── Main Entry Point ───────────────────────────────────────── */

/**
 * main()
 *
 * Orchestrates the entire pumping session:
 *   1. Print banner
 *   2. Load & validate configuration
 *   3. Loop N times, building + broadcasting a contract call each iteration
 *   4. Print a summary with success/fail counts and elapsed time
 */
async function main() {
  /* ── Step 1: Banner ──────────────────────────────────────── */
  printBanner(); // Show the ASCII art header

  /* ── Step 2: Configuration ───────────────────────────────── */

  // Parse CLI overrides on top of .env defaults.
  const config = parseArgs(); // Merge CLI flags with env vars

  // Read the private key from the environment.
  // This is the 64-character hex string that represents your
  // Stacks wallet's secret key.  It is used by `makeContractCall`
  // to sign each transaction before broadcast.
  let privateKey = process.env.PRIVATE_KEY; // Raw hex secret key

  // Sanitize the private key: strip quotes, 0x prefix, and whitespace
  if (privateKey) {
    privateKey = privateKey.trim().replace(/^["']|["']$/g, '');
    if (privateKey.startsWith('0x')) {
      privateKey = privateKey.slice(2);
    }
  }

  // Check if it's a seed phrase (contains spaces)
  if (privateKey && (privateKey.includes(' ') || privateKey.split(/\s+/).length > 4)) {
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
  const isHex = privateKey ? /^[0-9a-fA-F]+$/.test(privateKey) : false;
  const keyLength = privateKey ? privateKey.length : 0;

  if (privateKey && !isHex) {
    console.error('\n❌ Error: The PRIVATE_KEY in your .env contains non-hexadecimal characters.');
    process.exit(1);
  }

  if (privateKey && keyLength !== 64 && keyLength !== 66) {
    console.error('\n❌ Error: Stacks private keys must be exactly 64 or 66 characters long.');
    console.error(`   Your key is ${keyLength} characters long. Please check the key in pumper/.env.`);
    process.exit(1);
  }

  // Read the contract deployer's STX address.
  // This tells the Stacks node which on-chain contract to call.
  const contractAddress = process.env.CONTRACT_ADDRESS; // e.g. "ST1ABC..."

  // Read the contract name deployed at that address.
  // Combined with contractAddress this forms the fully-qualified
  // contract identifier: <contractAddress>.<contractName>
  const contractName = process.env.CONTRACT_NAME || 'stackdle'; // Default name

  // Destructure the parsed config for convenient access.
  const { count, delay, gameId, network } = config; // Spread into local vars

  /* ── Validation ──────────────────────────────────────────── */

  // Without a private key we cannot sign transactions, so bail early.
  if (!privateKey || privateKey === 'your_stacks_private_key_here') {
    // Inform the user exactly what's wrong and how to fix it.
    console.error('❌ ERROR: Set a valid PRIVATE_KEY in your .env file.');
    console.error('   Copy .env.example to .env and paste your hex key.'); // Hint
    process.exit(1); // Non-zero exit code signals failure to the shell
  }

  // The contract address is equally essential – we need to know
  // which deployed contract to invoke.
  if (!contractAddress || contractAddress === 'ST_YOUR_ADDRESS_HERE') {
    console.error('❌ ERROR: Set a valid CONTRACT_ADDRESS in your .env file.');
    process.exit(1); // Abort with error status
  }

  /* ── Config Summary ──────────────────────────────────────── */

  // Log the resolved configuration so the operator can verify
  // settings before transactions start flying.
  console.log('📋 Configuration:');                              // Section header
  console.log(`   Network  : ${network}`);                       // testnet or mainnet
  console.log(`   Contract : ${contractAddress}.${contractName}`); // Full contract ID
  console.log(`   Game ID  : ${gameId}`);                        // Which game round
  console.log(`   TX Count : ${count}`);                         // Total txs to send
  console.log(`   Delay    : ${delay}ms`);                       // Pause between txs
  console.log(`   Key      : ${maskKey(privateKey)}`);           // Masked private key
  console.log(''); // Blank line for visual separation

  /* ── Step 3: Transaction Loop ────────────────────────────── */

  let successCount = 0; // Tracks how many txs broadcast successfully
  let failCount    = 0; // Tracks how many txs encountered errors

  // Record the start time so we can compute total elapsed duration
  // once the loop finishes.  `Date.now()` returns Unix epoch ms.
  const startTime = Date.now(); // Capture loop start timestamp

  console.log('🚀 Starting transaction pump...\n'); // Announce loop start

  // Iterate `count` times, sending one contract call per iteration.
  for (let i = 0; i < count; i++) {
    const networkObj = network === 'mainnet' ? new StacksMainnet() : new StacksTestnet();

    try {
      /* ── Build the Transaction ───────────────────────────── */

      // `txOptions` describes the contract call we want to make:
      //   - contractAddress: the STX address that deployed the contract
      //   - contractName:    the on-chain name of the Clarity contract
      //   - functionName:    the public function to invoke ('enter-game')
      //   - functionArgs:    Clarity-typed arguments; here a single uint
      //                      representing the game ID the player enters
      //   - senderKey:       the private key used to sign the tx
      //   - network:         'testnet' or 'mainnet' – determines which
      //                      Stacks node URL is used for broadcast and
      //                      which chain ID is embedded in the tx
      const txOptions = {
        contractAddress: contractAddress,   // Who deployed the contract
        contractName:    contractName,      // Name of the deployed contract
        functionName:    'enter-game',      // Clarity function to call
        functionArgs:    [Cl.uint(gameId)], // Wrap gameId as a Clarity uint
        senderKey:       privateKey,        // Signs the tx with this key
        network:         networkObj,        // StacksNetwork object
      };

      // `makeContractCall` does several things under the hood:
      //   1. Fetches the sender's current nonce from the network
      //      (to prevent replay attacks and ensure ordering).
      //   2. Estimates the transaction fee (or uses a supplied one).
      //   3. Serializes the call into the Stacks wire format.
      //   4. Signs the serialized bytes with the sender's private key.
      // The returned `transaction` object is ready to broadcast.
      const transaction = await makeContractCall(txOptions); // Build + sign

      /* ── Broadcast the Transaction ───────────────────────── */

      // `broadcastTransaction` POSTs the signed transaction bytes to
      // the Stacks node's /v2/transactions endpoint.  The node
      // validates the tx and, if accepted, adds it to its mempool
      // for inclusion in a future block.
      //
      // The returned `result` contains:
      //   - txid:  the 64-char hex transaction ID (hash of the tx)
      //   - error: an error string if the node rejected the tx
      const result = await broadcastTransaction({ transaction }); // Send to node

      // Check if the broadcast response indicates an error.
      // Some Stacks nodes return a 200 status but include an error
      // field when the tx is malformed or the nonce is stale.
      if (result.error) {
        // Treat node-level rejection as a failure.
        console.log(`[${i + 1}/${count}] ❌ Error: ${result.error}`); // Log rejection
        failCount++; // Increment failure counter
      } else {
        // Success! The node accepted the transaction into its mempool.
        console.log(`[${i + 1}/${count}] ✅ TX: ${result.txid}`); // Log the txid
        successCount++; // Increment success counter
      }
    } catch (error) {
      // Catch any unexpected errors (network timeouts, JSON parse
      // failures, signing errors, etc.) so the loop keeps going.
      // We log the error message and continue to the next iteration
      // rather than crashing the entire session.
      console.log(`[${i + 1}/${count}] ❌ Error: ${error.message}`); // Log exception
      failCount++; // Count this as a failure
    }

    // Pause between transactions to avoid overwhelming the Stacks
    // node or hitting API rate limits.  Without this delay, rapid
    // submissions can cause nonce collisions (two txs sharing the
    // same nonce) or HTTP 429 (Too Many Requests) responses.
    // The delay also gives the mempool time to process each tx.
    if (i < count - 1) {
      // Only sleep if this isn't the last iteration (no point
      // waiting after the final tx).
      await sleep(delay); // Wait `delay` milliseconds before next tx
    }
  }

  /* ── Step 4: Summary ─────────────────────────────────────── */

  // Calculate how long the entire loop took.
  const endTime   = Date.now();               // Capture loop end timestamp
  const elapsedMs = endTime - startTime;       // Total duration in milliseconds
  const elapsedS  = (elapsedMs / 1000).toFixed(1); // Convert to seconds, 1 decimal

  // Print a clear summary block so the operator can quickly assess
  // the outcome without scrolling through individual log lines.
  console.log('\n═══════════════════════════════════════════'); // Separator line
  console.log('📊 Pump Session Summary');                      // Section title
  console.log('═══════════════════════════════════════════'); // Separator line
  console.log(`   Total TXs : ${count}`);                      // How many we attempted
  console.log(`   ✅ Success : ${successCount}`);               // How many succeeded
  console.log(`   ❌ Failed  : ${failCount}`);                  // How many failed
  console.log(`   ⏱  Elapsed : ${elapsedS}s`);                 // Wall-clock time
  console.log('═══════════════════════════════════════════'); // Closing separator
  console.log(''); // Final blank line for clean terminal output
}

/* ── Execute ────────────────────────────────────────────────── */

// Invoke the async main function.  If it rejects (throws), catch
// the error, print it, and exit with a non-zero code so CI/CD
// pipelines or shell scripts can detect the failure.
main().catch((error) => {
  console.error('💥 Fatal error:', error); // Log the unhandled exception
  process.exit(1);                         // Exit with failure status
});
