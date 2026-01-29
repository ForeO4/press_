/**
 * Role system for Press! Clubhouse
 *
 * Maps database membership roles to display roles with permission helpers.
 *
 * Role mapping:
 * - OWNER, ADMIN → Director (can start rounds, invite, configure)
 * - PLAYER → Player (can join, play, settle)
 * - VIEWER → Spectator (view-only)
 */

import type { MembershipRole } from '@/types';

// Display roles shown in UI
export type DisplayRole = 'Director' | 'Player' | 'Spectator';

/**
 * Convert database membership role to display role
 */
export function getDisplayRole(role: MembershipRole): DisplayRole {
  if (role === 'OWNER' || role === 'ADMIN') return 'Director';
  if (role === 'PLAYER') return 'Player';
  return 'Spectator';
}

/**
 * Get role badge color for UI display
 */
export function getRoleBadgeColor(role: DisplayRole): string {
  switch (role) {
    case 'Director':
      return 'bg-amber-500/20 text-amber-500';
    case 'Player':
      return 'bg-green-500/20 text-green-500';
    case 'Spectator':
      return 'bg-blue-500/20 text-blue-500';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

// Permission helpers

/**
 * Can start a new round
 */
export function canStartRound(role: MembershipRole): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

/**
 * Can invite new players
 */
export function canInvitePlayers(role: MembershipRole): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

/**
 * Can configure event settings
 */
export function canConfigureEvent(role: MembershipRole): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

/**
 * Can start or join a game
 */
export function canPlayGames(role: MembershipRole): boolean {
  return role === 'OWNER' || role === 'ADMIN' || role === 'PLAYER';
}

/**
 * Can settle bets
 */
export function canSettle(role: MembershipRole): boolean {
  return role === 'OWNER' || role === 'ADMIN' || role === 'PLAYER';
}

/**
 * Can view scores and leaderboard
 */
export function canViewScores(role: MembershipRole): boolean {
  // All roles can view
  return true;
}

/**
 * Can enter scores
 */
export function canEnterScores(role: MembershipRole): boolean {
  return role === 'OWNER' || role === 'ADMIN' || role === 'PLAYER';
}

/**
 * Can create a press
 */
export function canCreatePress(role: MembershipRole): boolean {
  return role === 'OWNER' || role === 'ADMIN' || role === 'PLAYER';
}

/**
 * Is an admin-level role (can manage event)
 */
export function isAdmin(role: MembershipRole): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

/**
 * Is the owner of the event
 */
export function isOwner(role: MembershipRole): boolean {
  return role === 'OWNER';
}

/**
 * Get all available actions for a role
 */
export interface RoleActions {
  canStartRound: boolean;
  canInvitePlayers: boolean;
  canConfigureEvent: boolean;
  canPlayGames: boolean;
  canSettle: boolean;
  canViewScores: boolean;
  canEnterScores: boolean;
  canCreatePress: boolean;
}

export function getRoleActions(role: MembershipRole): RoleActions {
  return {
    canStartRound: canStartRound(role),
    canInvitePlayers: canInvitePlayers(role),
    canConfigureEvent: canConfigureEvent(role),
    canPlayGames: canPlayGames(role),
    canSettle: canSettle(role),
    canViewScores: canViewScores(role),
    canEnterScores: canEnterScores(role),
    canCreatePress: canCreatePress(role),
  };
}
