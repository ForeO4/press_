import { createClient } from '@/lib/supabase/client';
import { SETTLEMENT_LIVE } from '@/lib/env/public';

export interface Settlement {
  id: string;
  event_id: string;
  game_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  status: 'pending' | 'completed';
  created_at: string;
}

export interface SettlementWithNames extends Settlement {
  payer_name: string;
  payee_name: string;
}

/**
 * Compute all settlements for an event using the RPC function
 */
export async function computeSettlement(eventId: string): Promise<Settlement[]> {
  if (!SETTLEMENT_LIVE) {
    console.log('[Settlement] Mock mode - returning empty settlements');
    return [];
  }

  const supabase = createClient();
  if (!supabase) {
    console.error('[Settlement] Supabase client not available');
    return [];
  }

  const { data, error } = await supabase
    .rpc('compute_event_settlements', { p_event_id: eventId });

  if (error) {
    console.error('[Settlement] Error computing settlements:', error);
    throw error;
  }

  return data ?? [];
}

/**
 * Get all settlements for an event
 */
export async function getEventSettlements(eventId: string): Promise<Settlement[]> {
  if (!SETTLEMENT_LIVE) {
    return [];
  }

  const supabase = createClient();
  if (!supabase) {
    console.error('[Settlement] Supabase client not available');
    return [];
  }

  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Settlement] Error fetching settlements:', error);
    throw error;
  }

  return data ?? [];
}

/**
 * Get user balance for an event (from teeth_balances)
 */
export async function getUserBalance(eventId: string, userId: string): Promise<number> {
  if (!SETTLEMENT_LIVE) {
    return 0;
  }

  const supabase = createClient();
  if (!supabase) {
    console.error('[Settlement] Supabase client not available');
    return 0;
  }

  const { data, error } = await supabase
    .from('teeth_balances')
    .select('balance')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('[Settlement] Error fetching balance:', error);
    throw error;
  }

  return data?.balance ?? 0;
}

/**
 * Get transaction history for a user in an event
 */
export async function getTransactionHistory(eventId: string, userId: string) {
  if (!SETTLEMENT_LIVE) {
    return [];
  }

  const supabase = createClient();
  if (!supabase) {
    console.error('[Settlement] Supabase client not available');
    return [];
  }

  const { data, error } = await supabase
    .from('teeth_ledger')
    .select('*')
    .eq('event_id', eventId)
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Settlement] Error fetching transactions:', error);
    throw error;
  }

  return data ?? [];
}

/**
 * Get settlements with resolved user names
 */
export async function getSettlementsWithNames(eventId: string): Promise<SettlementWithNames[]> {
  if (!SETTLEMENT_LIVE) {
    return [];
  }

  const settlements = await getEventSettlements(eventId);
  if (settlements.length === 0) return [];

  // Get unique user IDs
  const userIdSet = new Set(settlements.flatMap(s => [s.payer_id, s.payee_id]));
  const userIds = Array.from(userIdSet);

  const supabase = createClient();
  if (!supabase) {
    console.error('[Settlement] Supabase client not available');
    return settlements.map(s => ({
      ...s,
      payer_name: 'Unknown',
      payee_name: 'Unknown',
    }));
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .in('id', userIds);

  const nameMap = new Map<string, string>();
  profiles?.forEach(p => {
    nameMap.set(p.id, p.display_name || p.email || 'Unknown');
  });

  return settlements.map(s => ({
    ...s,
    payer_name: nameMap.get(s.payer_id) || 'Unknown',
    payee_name: nameMap.get(s.payee_id) || 'Unknown',
  }));
}
