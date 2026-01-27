import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
import type { PlayerProfile, CreatePlayerInput, HandicapProfile, MockUser } from '@/types';
import { mockUsers } from '@/lib/mock/users';
import { initializeBalance } from './gatorBucks';

// In-memory store for mock mode player profiles
const mockPlayerProfiles: Map<string, PlayerProfile> = new Map();

// In-memory store for mock mode handicap profiles
const mockHandicapProfiles: Map<string, HandicapProfile> = new Map();

/**
 * Create a new player in an event context
 * In Supabase mode, this creates a handicap_profile for an existing user
 * In mock mode, this creates an in-memory player
 */
export async function createPlayer(
  eventId: string,
  input: CreatePlayerInput
): Promise<{ player: MockUser; profile: PlayerProfile }> {
  // Demo events always use mock
  if (isMockMode || eventId.startsWith('demo-')) {
    return createMockPlayer(eventId, input);
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  // In Supabase mode, we need an existing user to create a player
  // For now, we'll check if there's an authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be authenticated to create player');

  const now = new Date().toISOString();

  // Upsert handicap profile
  if (input.handicapIndex !== undefined || input.ghinNumber) {
    const { error: handicapError } = await supabase
      .from('handicap_profiles')
      .upsert({
        user_id: user.id,
        handicap_index: input.handicapIndex ?? null,
        ghin_number: input.ghinNumber ?? null,
      }, { onConflict: 'user_id' });

    if (handicapError) throw handicapError;
  }

  // Update profile display name if provided
  if (input.name) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ display_name: input.name })
      .eq('id', user.id);

    if (profileError) throw profileError;
  }

  // Initialize Gator Bucks balance for this event
  await initializeBalance(eventId, user.id, 100);

  // Return unified player data
  const player: MockUser = {
    id: user.id,
    name: input.name,
    email: user.email ?? input.email ?? '',
    role: 'PLAYER',
  };

  const profile: PlayerProfile = {
    id: user.id,
    userId: user.id,
    name: input.name,
    email: user.email ?? input.email,
    phone: input.phone,
    ghinNumber: input.ghinNumber,
    handicapIndex: input.handicapIndex,
    createdAt: now,
    updatedAt: now,
  };

  return { player, profile };
}

/**
 * Create a mock player (for demo/mock mode)
 */
async function createMockPlayer(
  eventId: string,
  input: CreatePlayerInput
): Promise<{ player: MockUser; profile: PlayerProfile }> {
  const now = new Date().toISOString();
  const id = `player-${Date.now()}`;

  const player: MockUser = {
    id,
    name: input.name,
    email: input.email ?? `${input.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    role: 'PLAYER',
  };

  const profile: PlayerProfile = {
    id: `profile-${id}`,
    userId: id,
    name: input.name,
    email: input.email,
    phone: input.phone,
    ghinNumber: input.ghinNumber,
    handicapIndex: input.handicapIndex,
    createdAt: now,
    updatedAt: now,
  };

  mockPlayerProfiles.set(id, profile);

  if (input.handicapIndex !== undefined) {
    mockHandicapProfiles.set(id, {
      id: `handicap-${id}`,
      userId: id,
      handicapIndex: input.handicapIndex,
      ghinNumber: input.ghinNumber ?? null,
      updatedAt: now,
    });
  }

  await initializeBalance(eventId, id, 100);
  mockUsers.push(player);

  return { player, profile };
}

/**
 * Find a player by email
 */
export async function findByEmail(email: string): Promise<PlayerProfile | null> {
  if (isMockMode) {
    const profiles = Array.from(mockPlayerProfiles.values());
    for (const profile of profiles) {
      if (profile.email?.toLowerCase() === email.toLowerCase()) {
        return profile;
      }
    }
    return null;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  // Query auth.users through profiles join (profiles references auth.users)
  // Since we can't directly query auth.users, we need to use admin API or RPC
  // For now, search in profiles and check if user exists
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      display_name,
      avatar_url,
      created_at,
      updated_at
    `)
    .limit(100);

  if (error) throw error;

  // We can't directly query by email since profiles doesn't have email
  // This would need an RPC function or admin access to auth.users
  // For now, return null - email lookup requires different approach
  console.warn('[players] findByEmail requires RPC function for email lookup');
  return null;
}

/**
 * Get player profile by user ID
 */
export async function getProfile(userId: string): Promise<PlayerProfile | null> {
  if (isMockMode || userId.startsWith('player-') || userId.startsWith('demo-')) {
    return mockPlayerProfiles.get(userId) ?? null;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  // Get profile and handicap data together
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) {
    if (profileError.code === 'PGRST116') return null; // Not found
    throw profileError;
  }

  // Get handicap profile
  const { data: handicap } = await supabase
    .from('handicap_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Get user email from auth if possible
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.id === userId ? user.email : undefined;

  return mapProfileFromDb(profile, handicap, email);
}

/**
 * Get handicap profile by user ID
 */
export async function getHandicapProfile(userId: string): Promise<HandicapProfile | null> {
  if (isMockMode || userId.startsWith('player-') || userId.startsWith('demo-')) {
    return mockHandicapProfiles.get(userId) ?? null;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('handicap_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return mapHandicapFromDb(data);
}

/**
 * Update player profile
 */
export async function updateProfile(
  userId: string,
  updates: Partial<CreatePlayerInput>
): Promise<PlayerProfile | null> {
  if (isMockMode || userId.startsWith('player-') || userId.startsWith('demo-')) {
    return updateMockProfile(userId, updates);
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  // Update profiles table
  if (updates.name) {
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: updates.name })
      .eq('id', userId);

    if (error) throw error;
  }

  // Update handicap_profiles table
  if (updates.handicapIndex !== undefined || updates.ghinNumber !== undefined) {
    const handicapUpdates: Record<string, unknown> = {};
    if (updates.handicapIndex !== undefined) {
      handicapUpdates.handicap_index = updates.handicapIndex;
    }
    if (updates.ghinNumber !== undefined) {
      handicapUpdates.ghin_number = updates.ghinNumber;
    }

    // Upsert to create if doesn't exist
    const { error } = await supabase
      .from('handicap_profiles')
      .upsert({
        user_id: userId,
        ...handicapUpdates,
      }, { onConflict: 'user_id' });

    if (error) throw error;
  }

  // Return updated profile
  return getProfile(userId);
}

/**
 * Update mock profile (for demo/mock mode)
 */
function updateMockProfile(
  userId: string,
  updates: Partial<CreatePlayerInput>
): PlayerProfile | null {
  const profile = mockPlayerProfiles.get(userId);
  if (!profile) return null;

  const now = new Date().toISOString();
  const updated: PlayerProfile = {
    ...profile,
    ...updates,
    updatedAt: now,
  };

  mockPlayerProfiles.set(userId, updated);

  if (updates.handicapIndex !== undefined) {
    const handicap = mockHandicapProfiles.get(userId);
    if (handicap) {
      handicap.handicapIndex = updates.handicapIndex;
      handicap.updatedAt = now;
      if (updates.ghinNumber !== undefined) {
        handicap.ghinNumber = updates.ghinNumber ?? null;
      }
    } else {
      mockHandicapProfiles.set(userId, {
        id: `handicap-${userId}`,
        userId,
        handicapIndex: updates.handicapIndex,
        ghinNumber: updates.ghinNumber ?? null,
        updatedAt: now,
      });
    }
  }

  return updated;
}

/**
 * Link a player profile to an existing user account
 */
export async function linkToUser(
  profileId: string,
  userId: string
): Promise<PlayerProfile | null> {
  if (isMockMode || profileId.startsWith('player-') || profileId.startsWith('demo-')) {
    const profile = mockPlayerProfiles.get(profileId);
    if (!profile) return null;

    profile.userId = userId;
    profile.updatedAt = new Date().toISOString();
    return profile;
  }

  // In Supabase mode, profiles are tied to auth.users
  // This operation doesn't apply in the same way
  // Just return the profile for the target user
  return getProfile(userId);
}

/**
 * Get all members of an event with their profiles
 */
export async function getEventMembers(eventId: string): Promise<PlayerProfile[]> {
  if (isMockMode || eventId.startsWith('demo-')) {
    // Return mock users as profiles
    return mockUsers.map(u => ({
      id: u.id,
      userId: u.id,
      name: u.name,
      email: u.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('event_memberships')
    .select(`
      user_id,
      profiles!inner (
        id,
        display_name,
        avatar_url,
        created_at,
        updated_at
      )
    `)
    .eq('event_id', eventId)
    .eq('status', 'ACTIVE');

  if (error) throw error;

  // Get handicap profiles for all members
  const userIds = data?.map(d => d.user_id) ?? [];
  const { data: handicaps } = await supabase
    .from('handicap_profiles')
    .select('*')
    .in('user_id', userIds);

  const handicapMap = new Map(
    (handicaps ?? []).map(h => [h.user_id, h])
  );

  return (data ?? []).map(d => {
    // profiles is a single object from !inner join, not an array
    const profile = d.profiles as unknown as Record<string, unknown>;
    const handicap = handicapMap.get(d.user_id);
    return mapProfileFromDb(profile, handicap, undefined);
  });
}

/**
 * Map database rows to PlayerProfile type
 */
function mapProfileFromDb(
  profile: Record<string, unknown>,
  handicap: Record<string, unknown> | null | undefined,
  email: string | undefined
): PlayerProfile {
  return {
    id: profile.id as string,
    userId: profile.id as string,
    name: (profile.display_name as string) ?? '',
    email: email,
    ghinNumber: handicap?.ghin_number as string | undefined,
    handicapIndex: handicap?.handicap_index as number | undefined,
    createdAt: profile.created_at as string,
    updatedAt: profile.updated_at as string,
  };
}

/**
 * Map database row to HandicapProfile type
 */
function mapHandicapFromDb(row: Record<string, unknown>): HandicapProfile {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    handicapIndex: row.handicap_index as number | null,
    ghinNumber: row.ghin_number as string | null,
    updatedAt: row.updated_at as string,
  };
}
