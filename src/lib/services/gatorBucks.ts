import type { GatorBucksBalance, GatorBucksTransaction, Settlement } from '@/types';
import { mockGatorBucksBalances } from '@/lib/mock/data';
import { mockUsers } from '@/lib/mock/users';

// In-memory transaction store for mock mode
let mockTransactions: GatorBucksTransaction[] = [];

/**
 * Get balance for a user in an event
 */
export async function getBalance(
  eventId: string,
  userId: string
): Promise<GatorBucksBalance | null> {
  // Mock mode: return from mock data
  const balance = mockGatorBucksBalances.find(
    (b) => b.eventId === eventId && b.userId === userId
  );
  return balance ?? null;
}

/**
 * Get all balances for an event
 */
export async function getAllBalances(
  eventId: string
): Promise<GatorBucksBalance[]> {
  return mockGatorBucksBalances.filter((b) => b.eventId === eventId);
}

/**
 * Get transaction history for a user
 */
export async function getTransactionHistory(
  eventId: string,
  userId: string
): Promise<GatorBucksTransaction[]> {
  return mockTransactions
    .filter((t) => t.eventId === eventId && t.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Get all transactions for an event
 */
export async function getAllTransactions(
  eventId: string
): Promise<GatorBucksTransaction[]> {
  return mockTransactions
    .filter((t) => t.eventId === eventId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Record a settlement transaction (creates entries for both payer and payee)
 */
export async function recordSettlement(
  settlement: Settlement
): Promise<{ payerTransaction: GatorBucksTransaction; payeeTransaction: GatorBucksTransaction }> {
  const now = new Date().toISOString();

  // Find current balances
  const payerBalance = mockGatorBucksBalances.find(
    (b) => b.eventId === settlement.eventId && b.userId === settlement.payerId
  );
  const payeeBalance = mockGatorBucksBalances.find(
    (b) => b.eventId === settlement.eventId && b.userId === settlement.payeeId
  );

  const payerCurrentBalance = payerBalance?.balanceInt ?? 0;
  const payeeCurrentBalance = payeeBalance?.balanceInt ?? 0;

  // Create payer transaction (negative delta)
  const payerTransaction: GatorBucksTransaction = {
    id: `txn-${Date.now()}-payer`,
    eventId: settlement.eventId,
    userId: settlement.payerId,
    deltaInt: -settlement.amountInt,
    balanceInt: payerCurrentBalance - settlement.amountInt,
    reason: `Game settlement`,
    referenceType: 'settlement',
    referenceId: settlement.id,
    createdAt: now,
  };

  // Create payee transaction (positive delta)
  const payeeTransaction: GatorBucksTransaction = {
    id: `txn-${Date.now()}-payee`,
    eventId: settlement.eventId,
    userId: settlement.payeeId,
    deltaInt: settlement.amountInt,
    balanceInt: payeeCurrentBalance + settlement.amountInt,
    reason: `Game settlement`,
    referenceType: 'settlement',
    referenceId: settlement.id,
    createdAt: now,
  };

  // Update mock balances
  if (payerBalance) {
    payerBalance.balanceInt = payerTransaction.balanceInt;
    payerBalance.updatedAt = now;
  }
  if (payeeBalance) {
    payeeBalance.balanceInt = payeeTransaction.balanceInt;
    payeeBalance.updatedAt = now;
  }

  // Store transactions
  mockTransactions.push(payerTransaction, payeeTransaction);

  return { payerTransaction, payeeTransaction };
}

/**
 * Initialize balance for a new player
 */
export async function initializeBalance(
  eventId: string,
  userId: string,
  initialAmount: number = 100
): Promise<GatorBucksBalance> {
  const now = new Date().toISOString();

  const newBalance: GatorBucksBalance = {
    id: `balance-${userId}`,
    eventId,
    userId,
    balanceInt: initialAmount,
    updatedAt: now,
  };

  // Add to mock balances
  mockGatorBucksBalances.push(newBalance);

  // Create initial transaction
  const initialTransaction: GatorBucksTransaction = {
    id: `txn-${Date.now()}-init`,
    eventId,
    userId,
    deltaInt: initialAmount,
    balanceInt: initialAmount,
    reason: 'Initial balance',
    referenceType: 'adjustment',
    referenceId: null,
    createdAt: now,
  };

  mockTransactions.push(initialTransaction);

  return newBalance;
}

/**
 * Get user name helper
 */
export function getUserName(userId: string): string {
  return mockUsers.find((u) => u.id === userId)?.name ?? 'Unknown';
}
