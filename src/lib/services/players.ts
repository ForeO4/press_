import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
import type { PlayerProfile, CreatePlayerInput, HandicapProfile, MockUser, GuestPlayer } from '@/types';
import { mockUsers } from '@/lib/mock/users';
import { initializeBalance } from './gatorBucks';

// In-memory store for mock mode player profiles
const mockPlayerProfiles: Map<string, PlayerProfile> = new Map();

// In-memory store for mock mode handicap profiles
const mockHandicapProfiles: Map<string, HandicapProfile> = new Map();

/**
 * Create a new player in an event context
 * In Supabase mode, this creates a guest player (no account required)
 * In mock mode, this creates an in-memory player
 */
export async function createPlayer(
  eventId: string,
  input: CreatePlayerInput
): Promise<{ player: MockUser; profile: PlayerProfile }> {
  console.log('[players] createPlayer called:', { eventId, input });

  // Demo events always use mock
  if (isMockMode || eventId.startsWith('demo-')) {
    return createMockPlayer(eventId, input);
  }

  try {
    // In production, create a guest player
    const guestPlayer = await createGuestPlayer(eventId, input);
    console.log('[players] Guest player created:', guestPlayer);

    // Convert to MockUser/PlayerProfile format for compatibility
    const player: MockUser = {
      id: `guest-${guestPlayer.id}`, // Prefix to identify as guest
      name: guestPlayer.name,
      email: guestPlayer.email || '',
      role: 'PLAYER',
    };

    const profile: PlayerProfile = {
      id: guestPlayer.id,
      userId: `guest-${guestPlayer.id}`,
      name: guestPlayer.name,
      email: guestPlayer.email,
      phone: guestPlayer.phone,
      handicapIndex: guestPlayer.handicapIndex,
      createdAt: guestPlayer.createdAt,
      updatedAt: guestPlayer.createdAt,
    };

    return { player, profile };
  } catch (error) {
    console.error('[players] createPlayer failed:', error);
    throw error;
  }
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
      source: 'manual',
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
        source: 'manual',
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
 * Get all members of an event with their profiles (includes guest players)
 */
export async function getEventMembers(eventId: string): Promise<PlayerProfile[]> {
  console.log('[players] getEventMembers called:', { eventId });

  if (isMockMode || eventId.startsWith('demo-')) {
    // Return mock users as profiles plus any mock guest players
    const mockProfiles = mockUsers.map(u => ({
      id: u.id,
      userId: u.id,
      name: u.name,
      email: u.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    // Add mock guest players
    const guestProfiles = Array.from(mockGuestPlayers.values())
      .filter(g => g.eventId === eventId)
      .map(g => ({
        id: g.id,
        userId: `guest-${g.id}`,
        name: g.name,
        email: g.email,
        phone: g.phone,
        handicapIndex: g.handicapIndex,
        createdAt: g.createdAt,
        updatedAt: g.createdAt,
      }));

    console.log('[players] Mock mode - returning profiles:', { mockProfiles: mockProfiles.length, guestProfiles: guestProfiles.length });
    return [...mockProfiles, ...guestProfiles];
  }

  const supabase = createClient();
  if (!supabase) {
    console.error('[players] Supabase client not available');
    throw new Error('Supabase client not available');
  }

  try {
    // Fetch registered members and guest players in parallel
    const [membersResult, guestResult] = await Promise.all([
      supabase
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
        .eq('status', 'ACTIVE'),
      supabase
        .from('event_guest_players')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true }),
    ]);

    console.log('[players] getEventMembers query results:', {
      membersError: membersResult.error,
      membersCount: membersResult.data?.length ?? 0,
      guestError: guestResult.error,
      guestCount: guestResult.data?.length ?? 0,
    });

    if (membersResult.error) {
      console.error('[players] Failed to fetch event memberships:', membersResult.error);
      // Don't throw - continue with empty members, we may still have guest players
    }

    if (guestResult.error) {
      console.error('[players] Failed to fetch guest players:', guestResult.error);
      // Don't throw - continue with empty guests
    }

    // Get handicap profiles for registered members
    const userIds = membersResult.data?.map(d => d.user_id) ?? [];
    const { data: handicaps } = userIds.length > 0
      ? await supabase
          .from('handicap_profiles')
          .select('*')
          .in('user_id', userIds)
      : { data: [] };

    const handicapMap = new Map(
      (handicaps ?? []).map(h => [h.user_id, h])
    );

    // Map registered members to profiles
    const memberProfiles = (membersResult.data ?? []).map(d => {
      const profile = d.profiles as unknown as Record<string, unknown>;
      const handicap = handicapMap.get(d.user_id);
      return mapProfileFromDb(profile, handicap, undefined);
    });

    // Map guest players to profiles
    const guestProfiles: PlayerProfile[] = (guestResult.data ?? []).map(g => ({
      id: g.id as string,
      userId: `guest-${g.id}`,
      name: g.name as string,
      email: g.email as string | undefined,
      phone: g.phone as string | undefined,
      handicapIndex: g.handicap_index as number | undefined,
      createdAt: g.created_at as string,
      updatedAt: g.created_at as string,
    }));

    console.log('[players] getEventMembers returning:', {
      memberProfiles: memberProfiles.length,
      guestProfiles: guestProfiles.length,
      totalProfiles: memberProfiles.length + guestProfiles.length,
    });

    return [...memberProfiles, ...guestProfiles];
  } catch (error) {
    console.error('[players] getEventMembers failed:', error);
    // Return empty array instead of throwing to allow UI to show empty state
    return [];
  }
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
    source: (row.source as 'manual' | 'ghin_verified') || 'manual',
    homeCourseId: row.home_course_id as string | undefined,
    lastVerifiedAt: row.last_verified_at as string | undefined,
    updatedAt: row.updated_at as string,
  };
}

// ============================================
// GUEST PLAYER FUNCTIONS
// ============================================

// In-memory store for mock mode guest players
const mockGuestPlayers: Map<string, GuestPlayer> = new Map();

/**
 * Create a guest player (no Supabase account required)
 */
export async function createGuestPlayer(
  eventId: string,
  input: CreatePlayerInput
): Promise<GuestPlayer> {
  if (isMockMode || eventId.startsWith('demo-')) {
    // Mock mode: store in memory
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const guestPlayer: GuestPlayer = {
      id,
      eventId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      handicapIndex: input.handicapIndex,
      createdAt: now,
    };
    mockGuestPlayers.set(id, guestPlayer);
    return guestPlayer;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  // Get current user for created_by
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('event_guest_players')
    .insert({
      event_id: eventId,
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      handicap_index: input.handicapIndex ?? null,
      created_by: user?.id || null,
    })
    .select()
    .single();

  if (error) {
    console.error('[players] Failed to create guest player:', error);
    throw new Error(error.message || 'Failed to create guest player');
  }

  return mapGuestPlayerFromDb(data);
}

/**
 * Get all guest players for an event
 */
export async function getGuestPlayers(eventId: string): Promise<GuestPlayer[]> {
  if (isMockMode || eventId.startsWith('demo-')) {
    // Mock mode: filter from memory
    return Array.from(mockGuestPlayers.values()).filter(
      (p) => p.eventId === eventId
    );
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('event_guest_players')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[players] Failed to get guest players:', error);
    throw error;
  }

  return (data || []).map(mapGuestPlayerFromDb);
}

/**
 * Map database row to GuestPlayer type
 */
function mapGuestPlayerFromDb(row: Record<string, unknown>): GuestPlayer {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    name: row.name as string,
    email: row.email as string | undefined,
    phone: row.phone as string | undefined,
    handicapIndex: row.handicap_index as number | undefined,
    createdAt: row.created_at as string,
    createdBy: row.created_by as string | undefined,
  };
}
