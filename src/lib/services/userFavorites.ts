import type { UserSearchResult } from '@/types';

/**
 * Get favorite players for a user
 * These are players the user frequently plays with
 *
 * TODO: Implement backend storage for user favorites
 * For now, returns an empty array
 */
export async function getFavorites(userId: string): Promise<UserSearchResult[]> {
  // Placeholder - return empty array until feature is fully implemented
  // Future: fetch from user_player_favorites table in Supabase
  return [];
}

/**
 * Add a player to favorites
 */
export async function addFavorite(userId: string, playerId: string): Promise<void> {
  // TODO: Implement
  console.log('[userFavorites] addFavorite not implemented', { userId, playerId });
}

/**
 * Remove a player from favorites
 */
export async function removeFavorite(userId: string, playerId: string): Promise<void> {
  // TODO: Implement
  console.log('[userFavorites] removeFavorite not implemented', { userId, playerId });
}
