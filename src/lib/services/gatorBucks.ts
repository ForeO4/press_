import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
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
  // Demo events always use mock
  if (isMockMode || eventId.startsWith('demo-')) {
    const balance = mockGatorBucksBalances.find(
      (b) => b.eventId === eventId && b.userId === userId
    );
    return balance ?? null;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('teeth_balances')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return mapBalanceFromDb(data);
}

/**
 * Get all balances for an event
 */
export async function getAllBalances(
  eventId: string
): Promise<GatorBucksBalance[]> {
  // Demo events always use mock
  if (isMockMode || eventId.startsWith('demo-')) {
    return mockGatorBucksBalances.filter((b) => b.eventId === eventId);
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('teeth_balances')
    .select('*')
    .eq('event_id', eventId);

  if (error) throw error;

  return (data ?? []).map(mapBalanceFromDb);
}

/**
 * Get transaction history for a user
 */
export async function getTransactionHistory(
  eventId: string,
  userId: string
): Promise<GatorBucksTransaction[]> {
  // Demo events always use mock
  if (isMockMode || eventId.startsWith('demo-')) {
    return mockTransactions
      .filter((t) => t.eventId === eventId && t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('teeth_ledger')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(mapTransactionFromDb);
}

/**
 * Get all transactions for an event
 */
export async function getAllTransactions(
  eventId: string
): Promise<GatorBucksTransaction[]> {
  // Demo events always use mock
  if (isMockMode || eventId.startsWith('demo-')) {
    return mockTransactions
      .filter((t) => t.eventId === eventId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('teeth_ledger')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(mapTransactionFromDb);
}

/**
 * Record a settlement transaction (creates entries for both payer and payee)
 */
export async function recordSettlement(
  settlement: Settlement
): Promise<{ payerTransaction: GatorBucksTransaction; payeeTransaction: GatorBucksTransaction }> {
  // Demo events always use mock
  if (isMockMode || settlement.eventId.startsWith('demo-')) {
    return recordMockSettlement(settlement);
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  // Get current balances
  const { data: payerBalanceData } = await supabase
    .from('teeth_balances')
    .select('balance_int')
    .eq('event_id', settlement.eventId)
    .eq('user_id', settlement.payerId)
    .single();

  const { data: payeeBalanceData } = await supabase
    .from('teeth_balances')
    .select('balance_int')
    .eq('event_id', settlement.eventId)
    .eq('user_id', settlement.payeeId)
    .single();

  const payerCurrentBalance = payerBalanceData?.balance_int ?? 0;
  const payeeCurrentBalance = payeeBalanceData?.balance_int ?? 0;

  const newPayerBalance = payerCurrentBalance - settlement.amountInt;
  const newPayeeBalance = payeeCurrentBalance + settlement.amountInt;

  // Insert payer transaction (negative delta)
  const { data: payerTxn, error: payerTxnError } = await supabase
    .from('teeth_ledger')
    .insert({
      event_id: settlement.eventId,
      user_id: settlement.payerId,
      delta_int: -settlement.amountInt,
      balance_int: newPayerBalance,
      reason: 'Game settlement',
      reference_type: 'settlement',
      reference_id: settlement.id,
    })
    .select()
    .single();

  if (payerTxnError) throw payerTxnError;

  // Insert payee transaction (positive delta)
  const { data: payeeTxn, error: payeeTxnError } = await supabase
    .from('teeth_ledger')
    .insert({
      event_id: settlement.eventId,
      user_id: settlement.payeeId,
      delta_int: settlement.amountInt,
      balance_int: newPayeeBalance,
      reason: 'Game settlement',
      reference_type: 'settlement',
      reference_id: settlement.id,
    })
    .select()
    .single();

  if (payeeTxnError) throw payeeTxnError;

  // Update payer balance
  const { error: payerBalanceError } = await supabase
    .from('teeth_balances')
    .upsert({
      event_id: settlement.eventId,
      user_id: settlement.payerId,
      balance_int: newPayerBalance,
    }, { onConflict: 'event_id,user_id' });

  if (payerBalanceError) throw payerBalanceError;

  // Update payee balance
  const { error: payeeBalanceError } = await supabase
    .from('teeth_balances')
    .upsert({
      event_id: settlement.eventId,
      user_id: settlement.payeeId,
      balance_int: newPayeeBalance,
    }, { onConflict: 'event_id,user_id' });

  if (payeeBalanceError) throw payeeBalanceError;

  return {
    payerTransaction: mapTransactionFromDb(payerTxn),
    payeeTransaction: mapTransactionFromDb(payeeTxn),
  };
}

/**
 * Record settlement in mock mode
 */
function recordMockSettlement(
  settlement: Settlement
): { payerTransaction: GatorBucksTransaction; payeeTransaction: GatorBucksTransaction } {
  const now = new Date().toISOString();

  const payerBalance = mockGatorBucksBalances.find(
    (b) => b.eventId === settlement.eventId && b.userId === settlement.payerId
  );
  const payeeBalance = mockGatorBucksBalances.find(
    (b) => b.eventId === settlement.eventId && b.userId === settlement.payeeId
  );

  const payerCurrentBalance = payerBalance?.balanceInt ?? 0;
  const payeeCurrentBalance = payeeBalance?.balanceInt ?? 0;

  const payerTransaction: GatorBucksTransaction = {
    id: `txn-${Date.now()}-payer`,
    eventId: settlement.eventId,
    userId: settlement.payerId,
    deltaInt: -settlement.amountInt,
    balanceInt: payerCurrentBalance - settlement.amountInt,
    reason: 'Game settlement',
    referenceType: 'settlement',
    referenceId: settlement.id,
    createdAt: now,
  };

  const payeeTransaction: GatorBucksTransaction = {
    id: `txn-${Date.now()}-payee`,
    eventId: settlement.eventId,
    userId: settlement.payeeId,
    deltaInt: settlement.amountInt,
    balanceInt: payeeCurrentBalance + settlement.amountInt,
    reason: 'Game settlement',
    referenceType: 'settlement',
    referenceId: settlement.id,
    createdAt: now,
  };

  if (payerBalance) {
    payerBalance.balanceInt = payerTransaction.balanceInt;
    payerBalance.updatedAt = now;
  }
  if (payeeBalance) {
    payeeBalance.balanceInt = payeeTransaction.balanceInt;
    payeeBalance.updatedAt = now;
  }

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
  // Demo events always use mock
  if (isMockMode || eventId.startsWith('demo-')) {
    return initializeMockBalance(eventId, userId, initialAmount);
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  // Check if balance already exists
  const { data: existing } = await supabase
    .from('teeth_balances')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    return mapBalanceFromDb(existing);
  }

  // Create new balance
  const { data: balance, error: balanceError } = await supabase
    .from('teeth_balances')
    .insert({
      event_id: eventId,
      user_id: userId,
      balance_int: initialAmount,
    })
    .select()
    .single();

  if (balanceError) throw balanceError;

  // Create initial transaction
  const { error: txnError } = await supabase
    .from('teeth_ledger')
    .insert({
      event_id: eventId,
      user_id: userId,
      delta_int: initialAmount,
      balance_int: initialAmount,
      reason: 'Initial balance',
      reference_type: 'adjustment',
      reference_id: null,
    });

  if (txnError) throw txnError;

  return mapBalanceFromDb(balance);
}

/**
 * Initialize balance in mock mode
 */
function initializeMockBalance(
  eventId: string,
  userId: string,
  initialAmount: number
): GatorBucksBalance {
  const now = new Date().toISOString();

  // Check if balance already exists
  const existing = mockGatorBucksBalances.find(
    (b) => b.eventId === eventId && b.userId === userId
  );
  if (existing) {
    return existing;
  }

  const newBalance: GatorBucksBalance = {
    id: `balance-${userId}`,
    eventId,
    userId,
    balanceInt: initialAmount,
    updatedAt: now,
  };

  mockGatorBucksBalances.push(newBalance);

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

/**
 * Map database row to GatorBucksBalance type
 */
function mapBalanceFromDb(row: Record<string, unknown>): GatorBucksBalance {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    userId: row.user_id as string,
    balanceInt: row.balance_int as number,
    updatedAt: row.updated_at as string,
  };
}

/**
 * Map database row to GatorBucksTransaction type
 */
function mapTransactionFromDb(row: Record<string, unknown>): GatorBucksTransaction {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    userId: row.user_id as string,
    deltaInt: row.delta_int as number,
    balanceInt: row.balance_int as number,
    reason: row.reason as string,
    referenceType: row.reference_type as 'game' | 'settlement' | 'adjustment' | null,
    referenceId: row.reference_id as string | null,
    createdAt: row.created_at as string,
  };
}
