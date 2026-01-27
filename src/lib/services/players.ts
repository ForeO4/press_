import type { PlayerProfile, CreatePlayerInput, HandicapProfile, MockUser } from '@/types';
import { mockUsers } from '@/lib/mock/users';
import { initializeBalance } from './gatorBucks';

// In-memory store for player profiles
const playerProfiles: Map<string, PlayerProfile> = new Map();

// In-memory store for handicap profiles
const handicapProfiles: Map<string, HandicapProfile> = new Map();

/**
 * Create a new player
 */
export async function createPlayer(
  eventId: string,
  input: CreatePlayerInput
): Promise<{ player: MockUser; profile: PlayerProfile }> {
  const now = new Date().toISOString();
  const id = `player-${Date.now()}`;

  // Create the mock user
  const player: MockUser = {
    id,
    name: input.name,
    email: input.email ?? `${input.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    role: 'PLAYER',
  };

  // Create the player profile
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

  // Store the profile
  playerProfiles.set(id, profile);

  // Create handicap profile if handicap index is provided
  if (input.handicapIndex !== undefined) {
    const handicap: HandicapProfile = {
      id: `handicap-${id}`,
      userId: id,
      handicapIndex: input.handicapIndex,
      ghinNumber: input.ghinNumber ?? null,
      updatedAt: now,
    };
    handicapProfiles.set(id, handicap);
  }

  // Initialize Gator Bucks balance
  await initializeBalance(eventId, id, 100);

  // Add to mock users (for this session)
  mockUsers.push(player);

  return { player, profile };
}

/**
 * Find a player by email
 */
export async function findByEmail(email: string): Promise<PlayerProfile | null> {
  const profiles = Array.from(playerProfiles.values());
  for (const profile of profiles) {
    if (profile.email?.toLowerCase() === email.toLowerCase()) {
      return profile;
    }
  }
  return null;
}

/**
 * Get player profile by user ID
 */
export async function getProfile(userId: string): Promise<PlayerProfile | null> {
  return playerProfiles.get(userId) ?? null;
}

/**
 * Get handicap profile by user ID
 */
export async function getHandicapProfile(userId: string): Promise<HandicapProfile | null> {
  return handicapProfiles.get(userId) ?? null;
}

/**
 * Update player profile
 */
export async function updateProfile(
  userId: string,
  updates: Partial<CreatePlayerInput>
): Promise<PlayerProfile | null> {
  const profile = playerProfiles.get(userId);
  if (!profile) return null;

  const now = new Date().toISOString();
  const updated: PlayerProfile = {
    ...profile,
    ...updates,
    updatedAt: now,
  };

  playerProfiles.set(userId, updated);

  // Update handicap profile if index changed
  if (updates.handicapIndex !== undefined) {
    const handicap = handicapProfiles.get(userId);
    if (handicap) {
      handicap.handicapIndex = updates.handicapIndex;
      handicap.updatedAt = now;
      if (updates.ghinNumber !== undefined) {
        handicap.ghinNumber = updates.ghinNumber ?? null;
      }
    } else {
      // Create new handicap profile
      handicapProfiles.set(userId, {
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
  const profile = playerProfiles.get(profileId);
  if (!profile) return null;

  // In a real implementation, this would update the database
  // to link the profile to an authenticated user account
  profile.userId = userId;
  profile.updatedAt = new Date().toISOString();

  return profile;
}
