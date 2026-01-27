import type { EventSettings, AutoPressConfig } from '@/types';
import { mockEventSettings } from '@/lib/mock/data';
import { DEFAULT_AUTO_PRESS_CONFIG } from '@/lib/domain/games/autoPress';

// In-memory settings store
let settingsStore: EventSettings = { ...mockEventSettings };

/**
 * Get settings for an event
 */
export async function getSettings(eventId: string): Promise<EventSettings> {
  // In mock mode, return from store
  if (settingsStore.eventId === eventId) {
    return settingsStore;
  }
  return mockEventSettings;
}

/**
 * Get auto-press configuration for an event
 */
export async function getAutoPressConfig(eventId: string): Promise<AutoPressConfig> {
  const settings = await getSettings(eventId);
  return settings.pressRules ?? DEFAULT_AUTO_PRESS_CONFIG;
}

/**
 * Update press rules for an event
 */
export async function updatePressRules(
  eventId: string,
  pressRules: AutoPressConfig
): Promise<EventSettings> {
  const now = new Date().toISOString();

  settingsStore = {
    ...settingsStore,
    eventId,
    pressRules,
    updatedAt: now,
  };

  return settingsStore;
}

/**
 * Update auto-press enabled status
 */
export async function setAutoPressEnabled(
  eventId: string,
  enabled: boolean
): Promise<EventSettings> {
  const currentConfig = await getAutoPressConfig(eventId);
  return updatePressRules(eventId, {
    ...currentConfig,
    enabled,
  });
}

/**
 * Update auto-press trigger threshold
 */
export async function setAutoPressThreshold(
  eventId: string,
  trigger: number
): Promise<EventSettings> {
  const currentConfig = await getAutoPressConfig(eventId);
  return updatePressRules(eventId, {
    ...currentConfig,
    trigger: Math.max(1, Math.min(trigger, 9)),
  });
}

/**
 * Update max presses per game
 */
export async function setMaxPresses(
  eventId: string,
  maxPresses: number
): Promise<EventSettings> {
  const currentConfig = await getAutoPressConfig(eventId);
  return updatePressRules(eventId, {
    ...currentConfig,
    maxPresses: Math.max(1, Math.min(maxPresses, 10)),
  });
}

/**
 * Update self-press allowed status
 */
export async function setAllowSelfPress(
  eventId: string,
  allowSelfPress: boolean
): Promise<EventSettings> {
  const now = new Date().toISOString();

  settingsStore = {
    ...settingsStore,
    eventId,
    allowSelfPress,
    updatedAt: now,
  };

  return settingsStore;
}

/**
 * Update default bucks amount for new players
 */
export async function setDefaultBucks(
  eventId: string,
  defaultBucks: number
): Promise<EventSettings> {
  const now = new Date().toISOString();

  settingsStore = {
    ...settingsStore,
    eventId,
    defaultBucks: Math.max(0, Math.round(defaultBucks)),
    updatedAt: now,
  };

  return settingsStore;
}
