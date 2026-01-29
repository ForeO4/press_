import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
import type { EventMembership, MembershipRole, MembershipStatus } from '@/types';

// Mock data
const mockMembers: EventMembership[] = [
  {
    id: 'mem-1',
    eventId: 'demo-event-1',
    userId: 'user-1',
    role: 'OWNER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mem-2',
    eventId: 'demo-event-1',
    userId: 'user-2',
    role: 'PLAYER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mem-3',
    eventId: 'demo-event-1',
    userId: 'user-3',
    role: 'PLAYER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mem-4',
    eventId: 'demo-event-1',
    userId: 'user-4',
    role: 'PLAYER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
];

function shouldUseMockData(eventId: string): boolean {
  return isMockMode || eventId.startsWith('demo-');
}

/**
 * Get all members of an event
 */
export async function getEventMembers(eventId: string): Promise<EventMembership[]> {
  if (shouldUseMockData(eventId)) {
    return mockMembers.filter((m) => m.eventId === eventId || eventId.startsWith('demo-'));
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('event_memberships')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'ACTIVE')
    .order('role', { ascending: true });

  if (error) throw error;

  return (data || []).map(mapMembershipFromDb);
}

/**
 * Get current user's membership in an event
 */
export async function getUserEventMembership(
  eventId: string
): Promise<EventMembership | null> {
  if (shouldUseMockData(eventId)) {
    return mockMembers[0];
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) {
    return null;
  }

  const { data, error } = await supabase
    .from('event_memberships')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', user.user.id)
    .eq('status', 'ACTIVE')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapMembershipFromDb(data);
}

/**
 * Add a member to an event
 */
export async function addEventMember(
  eventId: string,
  userId: string,
  role: MembershipRole = 'PLAYER'
): Promise<EventMembership> {
  if (shouldUseMockData(eventId)) {
    const membership: EventMembership = {
      id: crypto.randomUUID(),
      eventId,
      userId,
      role,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    mockMembers.push(membership);
    return membership;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('event_memberships')
    .insert({
      event_id: eventId,
      user_id: userId,
      role,
      status: 'ACTIVE',
    })
    .select()
    .single();

  if (error) throw error;

  return mapMembershipFromDb(data);
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
  eventId: string,
  userId: string,
  role: MembershipRole
): Promise<EventMembership> {
  if (shouldUseMockData(eventId)) {
    const member = mockMembers.find((m) => m.userId === userId);
    if (member) {
      member.role = role;
      return member;
    }
    throw new Error('Member not found');
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('event_memberships')
    .update({ role })
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  return mapMembershipFromDb(data);
}

/**
 * Remove a member from an event
 */
export async function removeEventMember(
  eventId: string,
  userId: string
): Promise<void> {
  if (shouldUseMockData(eventId)) {
    const index = mockMembers.findIndex((m) => m.userId === userId);
    if (index !== -1) {
      mockMembers.splice(index, 1);
    }
    return;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { error } = await supabase
    .from('event_memberships')
    .update({ status: 'REMOVED' as MembershipStatus })
    .eq('event_id', eventId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Map database row to EventMembership type
 */
function mapMembershipFromDb(row: Record<string, unknown>): EventMembership {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    userId: row.user_id as string,
    role: row.role as MembershipRole,
    status: row.status as MembershipStatus,
    createdAt: row.created_at as string,
  };
}
