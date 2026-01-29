import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
import type {
  Clubhouse,
  ClubhouseMembership,
  ClubhouseWithMemberCount,
  CreateClubhouseInput,
  UpdateClubhouseInput,
  Event,
} from '@/types';

// ============================================
// MOCK DATA
// ============================================

const mockClubhouse: Clubhouse = {
  id: 'demo-clubhouse-1',
  name: 'Bandon Dunes Trip 2026',
  description: 'Annual golf trip to Bandon Dunes',
  type: 'trip',
  privacy: 'private',
  inviteCode: 'BANDON',
  inviteCodeEnabled: true,
  theme: 'links',
  createdBy: 'mock-user',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockMembership: ClubhouseMembership = {
  id: 'demo-membership-1',
  clubhouseId: 'demo-clubhouse-1',
  userId: 'mock-user',
  role: 'OWNER',
  status: 'ACTIVE',
  joinedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function shouldUseMockData(id?: string): boolean {
  return isMockMode || (id !== undefined && id.startsWith('demo-'));
}

// ============================================
// CLUBHOUSE CRUD
// ============================================

/**
 * Create a new clubhouse using RPC
 */
export async function createClubhouse(
  input: CreateClubhouseInput
): Promise<Clubhouse> {
  if (isMockMode) {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description,
      type: input.type || 'trip',
      privacy: input.privacy || 'private',
      inviteCode: generateMockInviteCode(),
      inviteCodeEnabled: true,
      theme: 'dark',
      createdBy: 'mock-user',
      createdAt: now,
      updatedAt: now,
    };
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase.rpc('rpc_create_clubhouse', {
    p_name: input.name,
    p_description: input.description || null,
    p_type: input.type || 'trip',
    p_privacy: input.privacy || 'private',
  });

  if (error) {
    console.error('[clubhouses] RPC error:', error);
    throw new Error(error.message || 'Database error creating clubhouse');
  }

  if (!data?.success || !data?.clubhouse) {
    console.error('[clubhouses] RPC returned invalid data:', data);
    throw new Error('Failed to create clubhouse - no data returned');
  }

  return mapClubhouseFromDb(data.clubhouse);
}

/**
 * Get a single clubhouse by ID
 */
export async function getClubhouse(clubhouseId: string): Promise<Clubhouse | null> {
  if (shouldUseMockData(clubhouseId)) {
    return clubhouseId.startsWith('demo-') ? { ...mockClubhouse, id: clubhouseId } : null;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('clubhouses')
    .select('*')
    .eq('id', clubhouseId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return mapClubhouseFromDb(data);
}

/**
 * Get a clubhouse by invite code
 */
export async function getClubhouseByInviteCode(inviteCode: string): Promise<Clubhouse | null> {
  if (isMockMode) {
    // Mock mode: check if code matches demo clubhouse
    if (inviteCode.toUpperCase() === mockClubhouse.inviteCode) {
      return mockClubhouse;
    }
    return null;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('clubhouses')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .eq('invite_code_enabled', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return mapClubhouseFromDb(data);
}

/**
 * Get all clubhouses for the current user
 */
export async function getUserClubhouses(): Promise<ClubhouseWithMemberCount[]> {
  if (isMockMode) {
    return [
      {
        ...mockClubhouse,
        memberCount: 8,
        eventCount: 2,
      },
    ];
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) {
    throw new Error('Not authenticated');
  }

  // Get clubhouses where user is an active member
  const { data, error } = await supabase
    .from('clubhouses')
    .select(`
      *,
      clubhouse_memberships!inner(user_id, status),
      member_count:clubhouse_memberships(count),
      event_count:events(count)
    `)
    .eq('clubhouse_memberships.user_id', user.user.id)
    .eq('clubhouse_memberships.status', 'ACTIVE')
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => ({
    ...mapClubhouseFromDb(row),
    memberCount: Array.isArray(row.member_count) ? row.member_count[0]?.count || 0 : 0,
    eventCount: Array.isArray(row.event_count) ? row.event_count[0]?.count || 0 : 0,
  }));
}

/**
 * Update a clubhouse using RPC
 */
export async function updateClubhouse(
  clubhouseId: string,
  input: UpdateClubhouseInput
): Promise<Clubhouse> {
  if (shouldUseMockData(clubhouseId)) {
    return {
      ...mockClubhouse,
      id: clubhouseId,
      ...input,
      updatedAt: new Date().toISOString(),
    };
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase.rpc('rpc_update_clubhouse', {
    p_clubhouse_id: clubhouseId,
    p_name: input.name || null,
    p_description: input.description || null,
    p_theme: input.theme || null,
    p_privacy: input.privacy || null,
    p_invite_code_enabled: input.inviteCodeEnabled ?? null,
  });

  if (error) {
    console.error('[clubhouses] Update RPC error:', error);
    throw new Error(error.message || 'Database error updating clubhouse');
  }

  if (!data?.success || !data?.clubhouse) {
    throw new Error('Failed to update clubhouse');
  }

  return mapClubhouseFromDb(data.clubhouse);
}

/**
 * Regenerate invite code for a clubhouse
 */
export async function regenerateInviteCode(clubhouseId: string): Promise<string> {
  if (shouldUseMockData(clubhouseId)) {
    return generateMockInviteCode();
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase.rpc('rpc_regenerate_invite_code', {
    p_clubhouse_id: clubhouseId,
  });

  if (error) {
    console.error('[clubhouses] Regenerate code RPC error:', error);
    throw new Error(error.message || 'Database error regenerating invite code');
  }

  if (!data?.success || !data?.clubhouse?.invite_code) {
    throw new Error('Failed to regenerate invite code');
  }

  return data.clubhouse.invite_code;
}

// ============================================
// MEMBERSHIP OPERATIONS
// ============================================

/**
 * Join a clubhouse by invite code using RPC
 */
export async function joinClubhouseByCode(inviteCode: string): Promise<Clubhouse> {
  if (isMockMode) {
    // In mock mode, just return the mock clubhouse
    if (inviteCode.toUpperCase() === mockClubhouse.inviteCode || inviteCode.length === 6) {
      return mockClubhouse;
    }
    throw new Error('Invalid invite code');
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase.rpc('rpc_join_clubhouse_by_code', {
    p_invite_code: inviteCode,
  });

  if (error) {
    console.error('[clubhouses] Join RPC error:', error);
    throw new Error(error.message || 'Failed to join clubhouse');
  }

  if (!data?.success || !data?.clubhouse) {
    throw new Error('Failed to join clubhouse');
  }

  return mapClubhouseFromDb(data.clubhouse);
}

/**
 * Get all members of a clubhouse
 */
export async function getClubhouseMembers(
  clubhouseId: string
): Promise<ClubhouseMembership[]> {
  if (shouldUseMockData(clubhouseId)) {
    return [mockMembership];
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('clubhouse_memberships')
    .select('*')
    .eq('clubhouse_id', clubhouseId)
    .eq('status', 'ACTIVE')
    .order('role', { ascending: true });

  if (error) throw error;

  return (data || []).map(mapMembershipFromDb);
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
  clubhouseId: string,
  userId: string,
  role: ClubhouseMembership['role']
): Promise<ClubhouseMembership> {
  if (shouldUseMockData(clubhouseId)) {
    return {
      ...mockMembership,
      userId,
      role,
      updatedAt: new Date().toISOString(),
    };
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase.rpc('rpc_update_clubhouse_member_role', {
    p_clubhouse_id: clubhouseId,
    p_user_id: userId,
    p_role: role,
  });

  if (error) {
    console.error('[clubhouses] Update role RPC error:', error);
    throw new Error(error.message || 'Failed to update member role');
  }

  if (!data?.success || !data?.membership) {
    throw new Error('Failed to update member role');
  }

  return mapMembershipFromDb(data.membership);
}

/**
 * Remove a member from a clubhouse
 */
export async function removeMember(
  clubhouseId: string,
  userId: string
): Promise<void> {
  if (shouldUseMockData(clubhouseId)) {
    return; // Mock success
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase.rpc('rpc_remove_clubhouse_member', {
    p_clubhouse_id: clubhouseId,
    p_user_id: userId,
  });

  if (error) {
    console.error('[clubhouses] Remove member RPC error:', error);
    throw new Error(error.message || 'Failed to remove member');
  }

  if (!data?.success) {
    throw new Error('Failed to remove member');
  }
}

/**
 * Get current user's membership in a clubhouse
 */
export async function getUserMembership(
  clubhouseId: string
): Promise<ClubhouseMembership | null> {
  if (shouldUseMockData(clubhouseId)) {
    return mockMembership;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) {
    return null;
  }

  const { data, error } = await supabase
    .from('clubhouse_memberships')
    .select('*')
    .eq('clubhouse_id', clubhouseId)
    .eq('user_id', user.user.id)
    .eq('status', 'ACTIVE')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return mapMembershipFromDb(data);
}

// ============================================
// EVENT OPERATIONS
// ============================================

/**
 * Get all events in a clubhouse
 */
export async function getClubhouseEvents(clubhouseId: string): Promise<Event[]> {
  if (shouldUseMockData(clubhouseId)) {
    // Return empty array for mock - events handled separately
    return [];
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('clubhouse_id', clubhouseId)
    .order('date', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapEventFromDb);
}

/**
 * Create an event in a clubhouse using RPC
 */
export async function createClubhouseEvent(
  clubhouseId: string,
  name: string,
  date: string,
  visibility: 'PRIVATE' | 'UNLISTED' | 'PUBLIC' = 'PRIVATE'
): Promise<Event> {
  if (shouldUseMockData(clubhouseId)) {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      name,
      date,
      visibility,
      isLocked: false,
      clubhouseId,
      createdBy: 'mock-user',
      createdAt: now,
      updatedAt: now,
    };
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase.rpc('rpc_create_clubhouse_event', {
    p_clubhouse_id: clubhouseId,
    p_name: name,
    p_date: date,
    p_visibility: visibility,
  });

  if (error) {
    console.error('[clubhouses] Create event RPC error:', error);
    throw new Error(error.message || 'Failed to create event');
  }

  if (!data?.success || !data?.event) {
    throw new Error('Failed to create event');
  }

  return mapEventFromDb(data.event);
}

// ============================================
// MAPPING FUNCTIONS
// ============================================

function mapClubhouseFromDb(row: Record<string, unknown>): Clubhouse {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    type: row.type as Clubhouse['type'],
    privacy: row.privacy as Clubhouse['privacy'],
    inviteCode: row.invite_code as string,
    inviteCodeEnabled: row.invite_code_enabled as boolean,
    theme: (row.theme as Clubhouse['theme']) || 'dark',
    logoUrl: row.logo_url as string | undefined,
    bannerUrl: row.banner_url as string | undefined,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapMembershipFromDb(row: Record<string, unknown>): ClubhouseMembership {
  return {
    id: row.id as string,
    clubhouseId: row.clubhouse_id as string,
    userId: row.user_id as string,
    role: row.role as ClubhouseMembership['role'],
    status: row.status as ClubhouseMembership['status'],
    nickname: row.nickname as string | undefined,
    joinedAt: row.joined_at as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapEventFromDb(row: Record<string, unknown>): Event {
  return {
    id: row.id as string,
    name: row.name as string,
    date: row.date as string,
    endDate: row.end_date as string | undefined,
    visibility: row.visibility as Event['visibility'],
    isLocked: row.is_locked as boolean,
    numRounds: row.num_rounds as number | undefined,
    numHoles: row.num_holes as number | undefined,
    defaultGameType: row.default_game_type as Event['defaultGameType'],
    theme: row.theme as Event['theme'],
    clubhouseId: row.clubhouse_id as string | undefined,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateMockInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
