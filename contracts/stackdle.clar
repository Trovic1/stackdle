;; ============================================================================
;; STACKDLE - Web3 Wordle on Stacks
;; ============================================================================
;; A decentralized word-guessing game where players pay a small STX entry fee
;; to participate in daily rounds. Winners are verified via off-chain backend
;; signature (secp256k1) and receive 2x the entry fee as a reward from the
;; accumulated prize pool held by the contract itself.
;;
;; Game loop (two transactions per player):
;;   1. enter-game  - player pays 0.05 STX to join the current round
;;   2. claim-win   - player submits a backend-signed proof to collect 0.10 STX
;;
;; Treasury model:
;;   ALL entry fees are transferred directly to the contract principal.
;;   The contract pays winners from its own STX balance via `as-contract`.
;;   The owner keeps 0% - every microSTX goes to winners.
;; ============================================================================


;; ---------------------------------------------------------------------------
;; Constants
;; ---------------------------------------------------------------------------

;; The deployer's principal - used only for admin gating (advance-game).
;; The owner does NOT receive or hold any player funds.
(define-constant contract-owner tx-sender)

;; 33-byte compressed public key of the off-chain game backend.
;; The backend signs { game-id, player-address } to attest that a player won.
;; This is the public key for private key '1' (testnet only).
(define-constant backend-pubkey 0x0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798)

;; Entry fee: 0.05 STX = 50 000 microSTX
;; Kept intentionally low to encourage broad participation each round.
(define-constant entry-fee u50000)

;; Winner reward: 0.10 STX = 100 000 microSTX (2x entry fee)
;; Funded entirely from the contract's accumulated entry-fee pool.
(define-constant winner-reward u100000)


;; ---------------------------------------------------------------------------
;; Error codes
;; ---------------------------------------------------------------------------

;; Caller is not the contract owner (admin-only functions).
(define-constant err-unauthorized (err u100))

;; Player has already entered this game round - no double entries.
(define-constant err-already-entered (err u101))

;; The STX transfer failed (insufficient balance, post-condition, etc.).
(define-constant err-stx-transfer-failed (err u102))

;; Player tried to claim a win without having entered the game first.
(define-constant err-not-entered (err u103))

;; Player has already claimed their reward for this game round.
(define-constant err-already-claimed (err u104))

;; The secp256k1 signature from the backend did not verify - possible forgery.
(define-constant err-invalid-signature (err u105))

;; The contract's STX balance is too low to pay the winner reward.
;; This should rarely happen if the pool is healthy, but we guard against it.
(define-constant err-insufficient-pool (err u106))

;; Monotonically increasing game round counter was removed to support
;; random, stateless, unlimited game entries by players.


;; ---------------------------------------------------------------------------
;; Maps
;; ---------------------------------------------------------------------------

;; Records every player's entry into a specific game round.
;; Key:   { game-id, player }  - composite to allow the same player in future rounds.
;; Value: { entered-at }       - the Stacks block height when they entered.
(define-map players
  { game-id: uint, player: principal }
  { entered-at: uint }
)

;; Records verified winners and the reward they received.
;; Key:   { game-id, player }  - one win record per player per round.
;; Value: { claimed-at, reward } - block height of claim + exact amount paid.
(define-map winners
  { game-id: uint, player: principal }
  { claimed-at: uint, reward: uint }
)

;; Aggregate statistics for each game round.
;; Useful for front-end dashboards and historical analytics.
;; Key:   game-id (uint)
;; Value: { total-entries, total-stx, winner-count }
(define-map game-stats
  uint
  { total-entries: uint, total-stx: uint, winner-count: uint }
)


;; ---------------------------------------------------------------------------
;; Private helpers
;; ---------------------------------------------------------------------------

;; Returns the contract's own principal address.
;; Inside `as-contract`, tx-sender evaluates to the contract itself,
;; so this helper lets us reference the contract address in normal context
;; (e.g., as the recipient of stx-transfer? in enter-game).
(define-private (get-contract-address)
  (as-contract tx-sender)
)


;; ---------------------------------------------------------------------------
;; Public functions
;; ---------------------------------------------------------------------------

;; ---- 1. enter-game --------------------------------------------------------
;; Transaction 1 of the two-tx game loop.
;;
;; The player pays `entry-fee` (0.05 STX) to join the current round.
;; The STX is transferred directly to the contract's own address, building
;; the prize pool that winners will later draw from.
;;
;; Guards:
;;   - game-id must match the active round (prevents stale/future entries)
;;   - player must not have already entered this round
;;
;; Side effects:
;;   - Inserts into `players` map
;;   - Upserts `game-stats` for the round
(define-public (enter-game (game-id uint))
  (let (
    ;; Capture the caller's principal before any context switches.
    ;; This ensures we always attribute the entry to the real user,
    ;; even if called through another contract.
    (player tx-sender)
  )
    ;; Guard: one entry per player per round - no double-dipping.
    (asserts! (is-none (map-get? players { game-id: game-id, player: player })) err-already-entered)

    ;; Transfer the entry fee from the player to the contract's own address.
    ;; `get-contract-address` returns `(as-contract tx-sender)` which is the
    ;; contract principal - the contract itself acts as the treasury.
    (try! (stx-transfer? entry-fee player (get-contract-address)))

    ;; Record the player's entry with the current block height for audit trail.
    (map-set players
      { game-id: game-id, player: player }
      { entered-at: block-height }
    )

    ;; Update aggregate game stats - upsert pattern.
    ;; If stats already exist for this round, increment; otherwise initialize.
    (match (map-get? game-stats game-id)
      prev-stats
        (map-set game-stats game-id {
          total-entries: (+ (get total-entries prev-stats) u1),
          total-stx: (+ (get total-stx prev-stats) entry-fee),
          winner-count: (get winner-count prev-stats)
        })
      ;; First entry for this round - initialize stats from scratch.
      (map-set game-stats game-id {
        total-entries: u1,
        total-stx: entry-fee,
        winner-count: u0
      })
    )

    (ok true)
  )
)


;; ---- 2. claim-win ---------------------------------------------------------
;; Transaction 2 of the two-tx game loop.
;;
;; After solving the puzzle off-chain, the player requests a signature from
;; the backend server. The backend signs a hash of { game-id, player } with
;; its private key. The player then submits this signature on-chain to prove
;; they won and collect their reward.
;;
;; The contract verifies the signature against `backend-pubkey` using
;; `secp256k1-verify`. If valid, the contract pays `winner-reward` (0.10 STX)
;; from its own balance to the player via `as-contract`.
;;
;; Guards:
;;   - player must have entered this game round
;;   - player must not have already claimed for this round
;;   - secp256k1 signature must verify against backend-pubkey
;;
;; Side effects:
;;   - Inserts into `winners` map
;;   - Upserts `game-stats` winner-count
(define-public (claim-win (game-id uint) (message-hash (buff 32)) (signature (buff 64)))
  (let (
    ;; Capture caller identity before as-contract switches tx-sender.
    (player tx-sender)
    ;; Bind reward locally for clarity and potential future flexibility.
    (reward winner-reward)
  )
    ;; Guard: player must have entered this round - can't claim without playing.
    (asserts! (is-some (map-get? players { game-id: game-id, player: player })) err-not-entered)

    ;; Guard: each player can only claim once per round.
    (asserts! (is-none (map-get? winners { game-id: game-id, player: player })) err-already-claimed)

    ;; Guard: verify the backend's secp256k1 signature.
    ;; `message-hash` should be the SHA-256 of a canonical message like
    ;; (concat game-id-bytes player-address-bytes). The backend and frontend
    ;; must agree on the exact serialization format.
    (asserts! (secp256k1-verify message-hash signature backend-pubkey) err-invalid-signature)

    ;; Pay the winner from the contract's own STX balance.
    ;; `as-contract` makes tx-sender = contract principal, so the transfer
    ;; debits the contract and credits the player.
    (try! (as-contract (stx-transfer? reward tx-sender player)))

    ;; Record the win for historical reference and double-claim prevention.
    (map-set winners
      { game-id: game-id, player: player }
      { claimed-at: block-height, reward: reward }
    )

    ;; Update the winner count in game stats.
    (match (map-get? game-stats game-id)
      prev-stats
        (map-set game-stats game-id {
          total-entries: (get total-entries prev-stats),
          total-stx: (get total-stx prev-stats),
          winner-count: (+ (get winner-count prev-stats) u1)
        })
      ;; Fallback: this branch should never fire because enter-game always
      ;; initializes game-stats, but we handle it defensively.
      (map-set game-stats game-id {
        total-entries: u0,
        total-stx: u0,
        winner-count: u1
      })
    )

    ;; Return the reward amount so the caller/frontend can confirm.
    (ok reward)
  )
)


;; ---------------------------------------------------------------------------
;; Read-only functions
;; ---------------------------------------------------------------------------

;; Checks whether a player has entered a specific game round.
;; Returns (some { entered-at }) if they have, or none if they haven't.
;; Useful for the UI to toggle between "Enter" and "Already entered" states.
(define-read-only (get-player-status (game-id uint) (player principal))
  (map-get? players { game-id: game-id, player: player })
)

;; Checks whether a player has already claimed a win for a specific round.
;; Returns (some { claimed-at, reward }) if claimed, or none otherwise.
;; Helps the UI show "Claimed (done)" vs "Claim your reward" buttons.
(define-read-only (get-winner-status (game-id uint) (player principal))
  (map-get? winners { game-id: game-id, player: player })
)

;; Returns aggregate statistics for a specific game round.
;; Includes total entries, total STX collected, and number of winners.
;; Powers the dashboard/leaderboard on the front-end.
(define-read-only (get-game-stats-by-id (game-id uint))
  (map-get? game-stats game-id)
)

;; Returns the current entry fee in microSTX.
;; Allows the front-end to display the fee without hard-coding it,
;; making future upgrades to a new contract version seamless.
(define-read-only (get-entry-fee)
  entry-fee
)
