import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';

export interface ShareLink {
  id: string;
  eventId: string;
  token: string;
  code: string;
  expiresAt: string | null;
  createdBy: string | null;
  createdAt: string;
}

// In-memory store for mock mode
const mockShareLinks: Map<string, ShareLink> = new Map();

/**
 * Generate a unique token
 */
function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

/**
 * Generate a 6-character alphanumeric code
 */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars: 0, O, I, 1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new share link for an event
 */
export async function createShareLink(
  eventId: string,
  userId: string,
  expiresInDays?: number
): Promise<ShareLink> {
  const token = generateToken();
  const code = generateCode();
  const now = new Date();
  const expiresAt = expiresInDays
    ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  // Demo events always use mock
  if (isMockMode || eventId.startsWith('demo-')) {
    const link: ShareLink = {
      id: `link-${Date.now()}`,
      eventId,
      token,
      code,
      expiresAt,
      createdBy: userId,
      createdAt: now.toISOString(),
    };
    mockShareLinks.set(token, link);
    mockShareLinks.set(code, link); // Also index by code
    return link;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  // Store both token and code in the token field, separated by a delimiter
  // This is a workaround since the table doesn't have a separate code column
  const combinedToken = `${token}:${code}`;

  const { data, error } = await supabase
    .from('share_links')
    .insert({
      event_id: eventId,
      token: combinedToken,
      expires_at: expiresAt,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;

  return mapFromDb(data);
}

/**
 * Get share link by token
 */
export async function getShareLinkByToken(token: string): Promise<ShareLink | null> {
  if (isMockMode) {
    return mockShareLinks.get(token) ?? null;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  // Search for token at the start of the combined token field
  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .like('token', `${token}:%`)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapFromDb(data);
}

/**
 * Get share link by code
 */
export async function getShareLinkByCode(code: string): Promise<ShareLink | null> {
  if (isMockMode) {
    return mockShareLinks.get(code.toUpperCase()) ?? null;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  // Search for code at the end of the combined token field
  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .like('token', `%:${code.toUpperCase()}`)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapFromDb(data);
}

/**
 * Get all share links for an event
 */
export async function getEventShareLinks(eventId: string): Promise<ShareLink[]> {
  if (isMockMode || eventId.startsWith('demo-')) {
    return Array.from(mockShareLinks.values()).filter((l) => l.eventId === eventId);
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(mapFromDb);
}

/**
 * Delete a share link
 */
export async function deleteShareLink(linkId: string): Promise<void> {
  if (isMockMode || linkId.startsWith('link-')) {
    // Find and delete by ID
    const keysToDelete: string[] = [];
    mockShareLinks.forEach((link, key) => {
      if (link.id === linkId) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => mockShareLinks.delete(key));
    return;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { error } = await supabase
    .from('share_links')
    .delete()
    .eq('id', linkId);

  if (error) throw error;
}

/**
 * Join an event via share link
 */
export async function joinEventViaLink(
  link: ShareLink,
  userId: string
): Promise<void> {
  // Check if link is expired
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    throw new Error('This invite link has expired');
  }

  if (isMockMode || link.eventId.startsWith('demo-')) {
    // Mock mode - just log
    console.log(`[invites] User ${userId} joined event ${link.eventId} via link`);
    return;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  // Check if already a member
  const { data: existing } = await supabase
    .from('event_memberships')
    .select('id')
    .eq('event_id', link.eventId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Already a member, just return
    return;
  }

  // Add as a player
  const { error } = await supabase
    .from('event_memberships')
    .insert({
      event_id: link.eventId,
      user_id: userId,
      role: 'PLAYER',
      status: 'ACTIVE',
    });

  if (error) throw error;
}

/**
 * Check if share link is valid
 */
export function isLinkValid(link: ShareLink): boolean {
  if (!link.expiresAt) return true;
  return new Date(link.expiresAt) > new Date();
}

/**
 * Map database row to ShareLink type
 */
function mapFromDb(row: Record<string, unknown>): ShareLink {
  const combinedToken = row.token as string;
  const [token, code] = combinedToken.includes(':')
    ? combinedToken.split(':')
    : [combinedToken, ''];

  return {
    id: row.id as string,
    eventId: row.event_id as string,
    token,
    code,
    expiresAt: row.expires_at as string | null,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as string,
  };
}
