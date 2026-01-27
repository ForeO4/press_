import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
import type { EventSettings, AutoPressConfig } from '@/types';
import { mockEventSettings } from '@/lib/mock/data';
import { DEFAULT_AUTO_PRESS_CONFIG } from '@/lib/domain/games/autoPress';

// In-memory settings store for mock mode
let mockSettingsStore: EventSettings = { ...mockEventSettings };

/**
 * Get settings for an event
 */
export async function getSettings(eventId: string): Promise<EventSettings> {
  // Demo events always use mock
  if (isMockMode || eventId.startsWith('demo-')) {
    if (mockSettingsStore.eventId === eventId) {
      return mockSettingsStore;
    }
    return { ...mockEventSettings, eventId };
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('event_settings')
    .select('*')
    .eq('event_id', eventId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Settings don't exist, return defaults
      return {
        eventId,
        pressRules: DEFAULT_AUTO_PRESS_CONFIG,
        defaultBucks: 100,
        allowSelfPress: true,
        updatedAt: new Date().toISOString(),
      };
    }
    throw error;
  }

  return mapSettingsFromDb(data);
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
  // Demo events always use mock
  if (isMockMode || eventId.startsWith('demo-')) {
    const now = new Date().toISOString();
    mockSettingsStore = {
      ...mockSettingsStore,
      eventId,
      pressRules,
      updatedAt: now,
    };
    return mockSettingsStore;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('event_settings')
    .upsert({
      event_id: eventId,
      press_rules: pressRules,
    }, { onConflict: 'event_id' })
    .select()
    .single();

  if (error) throw error;

  return mapSettingsFromDb(data);
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
  // Demo events always use mock
  if (isMockMode || eventId.startsWith('demo-')) {
    const now = new Date().toISOString();
    mockSettingsStore = {
      ...mockSettingsStore,
      eventId,
      allowSelfPress,
      updatedAt: now,
    };
    return mockSettingsStore;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('event_settings')
    .upsert({
      event_id: eventId,
      allow_self_press: allowSelfPress,
    }, { onConflict: 'event_id' })
    .select()
    .single();

  if (error) throw error;

  return mapSettingsFromDb(data);
}

/**
 * Update default bucks amount for new players
 */
export async function setDefaultBucks(
  eventId: string,
  defaultBucks: number
): Promise<EventSettings> {
  // Demo events always use mock
  if (isMockMode || eventId.startsWith('demo-')) {
    const now = new Date().toISOString();
    mockSettingsStore = {
      ...mockSettingsStore,
      eventId,
      defaultBucks: Math.max(0, Math.round(defaultBucks)),
      updatedAt: now,
    };
    return mockSettingsStore;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('event_settings')
    .upsert({
      event_id: eventId,
      default_teeth: Math.max(0, Math.round(defaultBucks)),
    }, { onConflict: 'event_id' })
    .select()
    .single();

  if (error) throw error;

  return mapSettingsFromDb(data);
}

/**
 * Create settings for a new event
 */
export async function createSettings(
  eventId: string,
  settings?: Partial<EventSettings>
): Promise<EventSettings> {
  // Demo events always use mock
  if (isMockMode || eventId.startsWith('demo-')) {
    const now = new Date().toISOString();
    mockSettingsStore = {
      eventId,
      pressRules: settings?.pressRules ?? DEFAULT_AUTO_PRESS_CONFIG,
      defaultBucks: settings?.defaultBucks ?? 100,
      allowSelfPress: settings?.allowSelfPress ?? true,
      updatedAt: now,
    };
    return mockSettingsStore;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('event_settings')
    .insert({
      event_id: eventId,
      press_rules: settings?.pressRules ?? DEFAULT_AUTO_PRESS_CONFIG,
      default_teeth: settings?.defaultBucks ?? 100,
      allow_self_press: settings?.allowSelfPress ?? true,
    })
    .select()
    .single();

  if (error) throw error;

  return mapSettingsFromDb(data);
}

/**
 * Map database row to EventSettings type
 */
function mapSettingsFromDb(row: Record<string, unknown>): EventSettings {
  const pressRules = row.press_rules as AutoPressConfig | null;

  return {
    eventId: row.event_id as string,
    pressRules: pressRules ?? DEFAULT_AUTO_PRESS_CONFIG,
    defaultBucks: row.default_teeth as number,
    allowSelfPress: row.allow_self_press as boolean,
    updatedAt: row.updated_at as string,
  };
}
