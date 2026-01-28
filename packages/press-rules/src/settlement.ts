/**
 * Press! Rules Engine - Settlement
 *
 * Ledger entry generation and balance computation for:
 * - Match play (winner receives stake * holesUp from loser)
 * - Skins (winner receives perSkin * (numPlayers - 1) for each skin)
 * - Team contests (winning team splits equally, losing team pays equally)
 * - Pots (winner(s) split pot contributed by all)
 */

import type {
  ContestId,
  PlayerId,
  Units,
  LedgerEntry,
  ContestSettlement,
  Team,
} from './types';

// ============================================
// ID GENERATION
// ============================================

let ledgerIdCounter = 0;

/**
 * Generate a unique ledger entry ID
 * Uses only counter for deterministic output
 */
function generateLedgerId(): string {
  ledgerIdCounter++;
  return `ledger-${ledgerIdCounter}`;
}

/**
 * Reset ledger ID counter (for testing)
 */
export function resetLedgerIdCounter(): void {
  ledgerIdCounter = 0;
}

// ============================================
// LEDGER ENTRY CREATION
// ============================================

/**
 * Create a ledger entry
 */
export function createLedgerEntry(
  contestId: ContestId,
  description: string,
  amount: Units,
  options?: {
    fromPlayerId?: PlayerId;
    toPlayerId?: PlayerId;
    splitAmongPlayerIds?: PlayerId[];
  }
): LedgerEntry {
  return {
    id: generateLedgerId(),
    contestId,
    description,
    amount,
    fromPlayerId: options?.fromPlayerId,
    toPlayerId: options?.toPlayerId,
    splitAmongPlayerIds: options?.splitAmongPlayerIds,
  };
}

// ============================================
// BALANCE COMPUTATION
// ============================================

/**
 * Compute net balances from ledger entries
 *
 * Positive balance = winning (receiving units)
 * Negative balance = owing (paying units)
 */
export function computeBalances(entries: LedgerEntry[]): Record<PlayerId, Units> {
  const balances: Record<PlayerId, Units> = {};

  const ensurePlayer = (playerId: PlayerId) => {
    if (balances[playerId] === undefined) {
      balances[playerId] = 0;
    }
  };

  for (const entry of entries) {
    // Direct payment: from -> to
    if (entry.fromPlayerId && entry.toPlayerId) {
      ensurePlayer(entry.fromPlayerId);
      ensurePlayer(entry.toPlayerId);
      balances[entry.fromPlayerId] -= entry.amount;
      balances[entry.toPlayerId] += entry.amount;
    }

    // Split payment: from -> split among multiple
    if (entry.fromPlayerId && entry.splitAmongPlayerIds && entry.splitAmongPlayerIds.length > 0) {
      ensurePlayer(entry.fromPlayerId);
      balances[entry.fromPlayerId] -= entry.amount;

      const perPlayer = Math.floor(entry.amount / entry.splitAmongPlayerIds.length);
      // Note: Any remainder from integer division is lost (round down)
      for (const recipientId of entry.splitAmongPlayerIds) {
        ensurePlayer(recipientId);
        balances[recipientId] += perPlayer;
      }
    }

    // Payment from multiple (no explicit from, but splitAmong receiving)
    if (!entry.fromPlayerId && entry.toPlayerId && entry.splitAmongPlayerIds) {
      // This case: multiple players pay, one receives
      // Not commonly used in our patterns, but supported
      ensurePlayer(entry.toPlayerId);
      balances[entry.toPlayerId] += entry.amount;

      const perPayer = Math.floor(entry.amount / entry.splitAmongPlayerIds.length);
      for (const payerId of entry.splitAmongPlayerIds) {
        ensurePlayer(payerId);
        balances[payerId] -= perPayer;
      }
    }
  }

  return balances;
}

/**
 * Create empty settlement result
 */
export function createEmptySettlement(): ContestSettlement {
  return {
    ledgerEntries: [],
    balancesByPlayerId: {},
  };
}

/**
 * Build settlement result from ledger entries
 */
export function buildSettlement(entries: LedgerEntry[]): ContestSettlement {
  return {
    ledgerEntries: entries,
    balancesByPlayerId: computeBalances(entries),
  };
}

// ============================================
// MATCH PLAY SETTLEMENT
// ============================================

/**
 * Create settlement entries for match play
 *
 * Winner receives: stake * holesUp from loser
 *
 * @param contestId - Contest identifier
 * @param winnerId - Winner player ID
 * @param loserId - Loser player ID
 * @param holesUp - Number of holes winner is up by
 * @param stake - Stake per hole
 * @param description - Description for ledger entry
 */
export function settleMatchPlay(
  contestId: ContestId,
  winnerId: PlayerId,
  loserId: PlayerId,
  holesUp: number,
  stake: Units,
  description: string
): LedgerEntry[] {
  if (holesUp === 0) {
    // All square - no settlement
    return [];
  }

  const amount = stake * holesUp;

  return [
    createLedgerEntry(contestId, description, amount, {
      fromPlayerId: loserId,
      toPlayerId: winnerId,
    }),
  ];
}

/**
 * Create settlement entries for team match play
 *
 * Winning team splits equally, losing team pays equally
 *
 * @param contestId - Contest identifier
 * @param winningTeam - Winning team
 * @param losingTeam - Losing team
 * @param holesUp - Number of holes winning team is up
 * @param stake - Stake per hole
 * @param description - Description for ledger entry
 */
export function settleTeamMatchPlay(
  contestId: ContestId,
  winningTeam: Team,
  losingTeam: Team,
  holesUp: number,
  stake: Units,
  description: string
): LedgerEntry[] {
  if (holesUp === 0) {
    return [];
  }

  const totalAmount = stake * holesUp;

  // Each losing player pays half, each winning player receives half
  const perPlayer = Math.floor(totalAmount / 2);

  const entries: LedgerEntry[] = [];

  // Create entries for each losing player paying each winning player
  for (const loserId of losingTeam.playerIds) {
    for (const winnerId of winningTeam.playerIds) {
      entries.push(
        createLedgerEntry(contestId, description, perPlayer, {
          fromPlayerId: loserId,
          toPlayerId: winnerId,
        })
      );
    }
  }

  return entries;
}

// ============================================
// SKINS SETTLEMENT
// ============================================

/**
 * Create settlement entries for skins
 *
 * Each skin winner receives: perSkin * (numPlayers - 1)
 * (Winner collects perSkin from each other player)
 *
 * @param contestId - Contest identifier
 * @param skinsWon - Map of player ID to number of skins won
 * @param perSkin - Value per skin
 * @param allPlayerIds - All player IDs in the contest
 */
export function settleSkins(
  contestId: ContestId,
  skinsWon: Record<PlayerId, number>,
  perSkin: Units,
  allPlayerIds: PlayerId[]
): LedgerEntry[] {
  const entries: LedgerEntry[] = [];

  // For each player who won skins
  for (const [winnerId, skinCount] of Object.entries(skinsWon)) {
    if (skinCount <= 0) continue;

    // Winner collects perSkin from each other player for each skin
    const otherPlayerIds = allPlayerIds.filter((id) => id !== winnerId);

    for (let i = 0; i < skinCount; i++) {
      // For each skin, winner collects from all others
      for (const payerId of otherPlayerIds) {
        entries.push(
          createLedgerEntry(
            contestId,
            `Skin #${i + 1} to ${winnerId}`,
            perSkin,
            {
              fromPlayerId: payerId,
              toPlayerId: winnerId,
            }
          )
        );
      }
    }
  }

  return entries;
}

/**
 * Create settlement entries for skins using pot total
 *
 * Total pot is divided among all skin winners proportionally
 *
 * @param contestId - Contest identifier
 * @param skinsWon - Map of player ID to number of skins won
 * @param potTotal - Total pot amount
 * @param allPlayerIds - All player IDs in the contest
 */
export function settleSkinsWithPot(
  contestId: ContestId,
  skinsWon: Record<PlayerId, number>,
  potTotal: Units,
  allPlayerIds: PlayerId[]
): LedgerEntry[] {
  const entries: LedgerEntry[] = [];

  // Calculate total skins won
  const totalSkinsWon = Object.values(skinsWon).reduce((sum, count) => sum + count, 0);
  if (totalSkinsWon === 0) {
    return entries;
  }

  // Calculate value per skin
  const valuePerSkin = Math.floor(potTotal / totalSkinsWon);

  // Each player contributes equally to the pot
  const perPlayerContribution = Math.floor(potTotal / allPlayerIds.length);

  // Track net positions
  const netPositions: Record<PlayerId, Units> = {};
  for (const playerId of allPlayerIds) {
    // Everyone pays into pot
    netPositions[playerId] = -perPlayerContribution;
    // Winners receive based on skins won
    const playerSkins = skinsWon[playerId] ?? 0;
    netPositions[playerId] += playerSkins * valuePerSkin;
  }

  // Create ledger entries for net transfers
  // Simplify: losers pay winners
  const losers = allPlayerIds.filter((id) => netPositions[id] < 0);
  const winners = allPlayerIds.filter((id) => netPositions[id] > 0);

  // Simple settlement: each loser pays each winner proportionally
  // This is a simplification - real implementation might do direct transfers
  for (const winnerId of winners) {
    const winnings = netPositions[winnerId];
    entries.push(
      createLedgerEntry(
        contestId,
        `Skins pot winnings`,
        winnings,
        {
          toPlayerId: winnerId,
          splitAmongPlayerIds: losers,
        }
      )
    );
  }

  return entries;
}

// ============================================
// POT SETTLEMENT (CTP, Long Drive, Birdie Pool)
// ============================================

/**
 * Create settlement entries for a pot that is split among winners
 *
 * @param contestId - Contest identifier
 * @param potTotal - Total pot amount
 * @param winnerIds - Players who win the pot
 * @param contributorIds - Players who contributed to the pot
 * @param description - Description for ledger entry
 */
export function settlePot(
  contestId: ContestId,
  potTotal: Units,
  winnerIds: PlayerId[],
  contributorIds: PlayerId[],
  description: string
): LedgerEntry[] {
  if (winnerIds.length === 0 || potTotal <= 0) {
    return [];
  }

  const entries: LedgerEntry[] = [];

  // Non-winning contributors
  const nonWinningContributors = contributorIds.filter((id) => !winnerIds.includes(id));

  if (nonWinningContributors.length === 0) {
    // All contributors are winners - no transfers needed
    return entries;
  }

  // Each contributor pays their share
  const perContributor = Math.floor(potTotal / contributorIds.length);

  // Winners who also contributed get net (perWinner - perContributor)
  // Non-winning contributors pay perContributor

  for (const winnerId of winnerIds) {
    for (const contributorId of nonWinningContributors) {
      const payment = Math.floor(perContributor / winnerIds.length);
      if (payment > 0) {
        entries.push(
          createLedgerEntry(contestId, description, payment, {
            fromPlayerId: contributorId,
            toPlayerId: winnerId,
          })
        );
      }
    }
  }

  return entries;
}

/**
 * Create settlement entries for per-hole pot (CTP, Long Drive)
 *
 * @param contestId - Contest identifier
 * @param perHoleValue - Value per hole
 * @param holeWinners - Map of hole number to winner ID
 * @param allPlayerIds - All player IDs
 * @param potDescription - Description prefix
 */
export function settlePerHolePot(
  contestId: ContestId,
  perHoleValue: Units,
  holeWinners: Record<number, PlayerId>,
  allPlayerIds: PlayerId[],
  potDescription: string
): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  const numPlayers = allPlayerIds.length;

  for (const [holeStr, winnerId] of Object.entries(holeWinners)) {
    const hole = parseInt(holeStr, 10);
    const otherPlayerIds = allPlayerIds.filter((id) => id !== winnerId);

    // Winner collects from all others
    for (const payerId of otherPlayerIds) {
      const payment = Math.floor(perHoleValue / (numPlayers - 1));
      if (payment > 0) {
        entries.push(
          createLedgerEntry(
            contestId,
            `${potDescription} Hole ${hole}`,
            payment,
            {
              fromPlayerId: payerId,
              toPlayerId: winnerId,
            }
          )
        );
      }
    }
  }

  return entries;
}

// ============================================
// SNAKE SETTLEMENT
// ============================================

/**
 * Create settlement entries for Snake
 *
 * Last player holding the snake pays all other players
 *
 * @param contestId - Contest identifier
 * @param snakeHolderId - Player currently holding the snake (last 3-putt)
 * @param potTotal - Total pot (snake holder pays this to others)
 * @param allPlayerIds - All player IDs
 */
export function settleSnake(
  contestId: ContestId,
  snakeHolderId: PlayerId | null,
  potTotal: Units,
  allPlayerIds: PlayerId[]
): LedgerEntry[] {
  if (!snakeHolderId || potTotal <= 0) {
    return [];
  }

  const entries: LedgerEntry[] = [];
  const otherPlayerIds = allPlayerIds.filter((id) => id !== snakeHolderId);

  if (otherPlayerIds.length === 0) {
    return entries;
  }

  // Snake holder pays equally to all others
  const perPlayer = Math.floor(potTotal / otherPlayerIds.length);

  for (const recipientId of otherPlayerIds) {
    entries.push(
      createLedgerEntry(
        contestId,
        'Snake penalty',
        perPlayer,
        {
          fromPlayerId: snakeHolderId,
          toPlayerId: recipientId,
        }
      )
    );
  }

  return entries;
}

// ============================================
// STABLEFORD SETTLEMENT
// ============================================

/**
 * Create settlement entries for Stableford
 *
 * Winner takes stake from all losers
 *
 * @param contestId - Contest identifier
 * @param winnerIds - Winner(s) - can be multiple for ties
 * @param loserIds - All other players
 * @param stake - Total stake
 */
export function settleStableford(
  contestId: ContestId,
  winnerIds: PlayerId[],
  loserIds: PlayerId[],
  stake: Units
): LedgerEntry[] {
  if (winnerIds.length === 0 || loserIds.length === 0 || stake <= 0) {
    return [];
  }

  const entries: LedgerEntry[] = [];

  // Each loser pays their share
  const perLoser = Math.floor(stake / (winnerIds.length + loserIds.length - 1));

  for (const loserId of loserIds) {
    // Split loser's payment among winners
    const perWinner = Math.floor(perLoser / winnerIds.length);
    for (const winnerId of winnerIds) {
      if (perWinner > 0) {
        entries.push(
          createLedgerEntry(
            contestId,
            'Stableford',
            perWinner,
            {
              fromPlayerId: loserId,
              toPlayerId: winnerId,
            }
          )
        );
      }
    }
  }

  return entries;
}

// ============================================
// AGGREGATE SETTLEMENT
// ============================================

/**
 * Aggregate settlements from multiple contests
 */
export function aggregateSettlements(
  settlements: ContestSettlement[]
): {
  allEntries: LedgerEntry[];
  netBalances: Record<PlayerId, Units>;
} {
  const allEntries: LedgerEntry[] = [];

  for (const settlement of settlements) {
    allEntries.push(...settlement.ledgerEntries);
  }

  return {
    allEntries,
    netBalances: computeBalances(allEntries),
  };
}
