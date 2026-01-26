import { create } from 'zustand';
import { mockScores, mockRounds } from '@/lib/mock/data';
import { getEventTeeSnapshot } from '@/lib/services/courses';
import { upsertScore, getScoresForEvent, getEventRounds } from '@/lib/services/scores';
import type { TeeSnapshot } from '@/types';

interface SelectedCell {
  playerId: string;
  holeNumber: number;
}

interface PendingChange {
  roundId: string;
  holeNumber: number;
  strokes: number;
  timestamp: number;
}

interface ScorecardStore {
  // Scores indexed by playerId, then holeNumber
  scores: Record<string, Record<number, number>>;
  selectedCell: SelectedCell | null;
  isEditorOpen: boolean;

  // Event context
  currentEventId: string | null;
  playerRoundMap: Record<string, string>; // userId -> roundId
  roundToUserMap: Record<string, string>; // roundId -> userId (for realtime)

  // Persistence state
  scoresLoading: boolean;
  scoresError: string | null;
  pendingSaves: Map<string, ReturnType<typeof setTimeout>>; // key -> timeout ID

  // Realtime state
  pendingChanges: Map<string, PendingChange>; // key -> pending change (for echo detection)

  // Tee selection
  eventDefaultTeeId: string;
  playerTeeOverrides: Record<string, string>; // playerId -> teeSetId

  // Course data from server
  courseData: TeeSnapshot | null;
  courseDataLoading: boolean;
  courseDataError: string | null;

  // Actions
  selectCell: (playerId: string, holeNumber: number) => void;
  clearSelection: () => void;
  openEditor: () => void;
  closeEditor: () => void;
  setScore: (playerId: string, holeNumber: number, strokes: number) => void;
  incrementScore: (playerId: string, holeNumber: number) => void;
  decrementScore: (playerId: string, holeNumber: number) => void;
  getScore: (playerId: string, holeNumber: number) => number | null;

  // Persistence actions
  initializeEventScores: (eventId: string) => Promise<void>;
  handleRemoteScoreChange: (roundId: string, holeNumber: number, strokes: number) => void;

  // Tee actions
  setEventDefaultTee: (teeSetId: string) => void;
  setPlayerTee: (playerId: string, teeSetId: string) => void;
  clearPlayerTee: (playerId: string) => void;
  getPlayerTee: (playerId: string) => string;

  // Course data actions
  loadCourseData: (eventId: string) => Promise<void>;
  clearCourseData: () => void;
}

/**
 * Initialize scores from mock data
 */
function initializeScores(): Record<string, Record<number, number>> {
  const scores: Record<string, Record<number, number>> = {};

  for (const round of mockRounds) {
    const userId = round.userId;
    scores[userId] = {};

    const playerScores = mockScores.filter((s) => s.roundId === round.id);
    for (const score of playerScores) {
      scores[userId][score.holeNumber] = score.strokes;
    }
  }

  return scores;
}

// Debounce delay for score persistence (ms)
const SAVE_DEBOUNCE_MS = 300;

// Window for detecting own changes echoed back via realtime (ms)
const PENDING_CHANGE_TTL_MS = 3000;

export const useScorecardStore = create<ScorecardStore>((set, get) => ({
  scores: initializeScores(),
  selectedCell: null,
  isEditorOpen: false,

  // Event context
  currentEventId: null,
  playerRoundMap: {},
  roundToUserMap: {},

  // Persistence state
  scoresLoading: false,
  scoresError: null,
  pendingSaves: new Map(),

  // Realtime state
  pendingChanges: new Map(),

  // Tee selection
  eventDefaultTeeId: 'tee-set-blue',
  playerTeeOverrides: {},

  // Course data
  courseData: null,
  courseDataLoading: false,
  courseDataError: null,

  selectCell: (playerId, holeNumber) => {
    set({ selectedCell: { playerId, holeNumber }, isEditorOpen: true });
  },

  clearSelection: () => {
    set({ selectedCell: null, isEditorOpen: false });
  },

  openEditor: () => {
    set({ isEditorOpen: true });
  },

  closeEditor: () => {
    set({ isEditorOpen: false });
  },

  setScore: (playerId, holeNumber, strokes) => {
    if (strokes < 1) return;

    const state = get();
    const previousStrokes = state.scores[playerId]?.[holeNumber];

    // Optimistic update - apply immediately to UI
    set((state) => ({
      scores: {
        ...state.scores,
        [playerId]: {
          ...state.scores[playerId],
          [holeNumber]: strokes,
        },
      },
    }));

    // Only persist if we have event context
    const eventId = state.currentEventId;
    const roundId = state.playerRoundMap[playerId];
    if (!eventId || !roundId) return;

    // Debounce persistence - clear any pending save for this cell
    const saveKey = `${roundId}-${holeNumber}`;
    const existingTimeout = state.pendingSaves.get(saveKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule new save
    const timeoutId = setTimeout(async () => {
      try {
        // Track this change for realtime echo detection
        const pendingKey = `${roundId}-${holeNumber}`;
        get().pendingChanges.set(pendingKey, {
          roundId,
          holeNumber,
          strokes,
          timestamp: Date.now(),
        });

        // Clear the pending change after TTL
        setTimeout(() => {
          get().pendingChanges.delete(pendingKey);
        }, PENDING_CHANGE_TTL_MS);

        await upsertScore(eventId, roundId, playerId, holeNumber, strokes);

        // Clear from pending saves
        get().pendingSaves.delete(saveKey);
      } catch (error) {
        console.error('[scorecardStore] Failed to save score:', error);

        // Rollback on error if the score hasn't changed since
        const currentStrokes = get().scores[playerId]?.[holeNumber];
        if (currentStrokes === strokes && previousStrokes !== undefined) {
          set((state) => ({
            scores: {
              ...state.scores,
              [playerId]: {
                ...state.scores[playerId],
                [holeNumber]: previousStrokes,
              },
            },
            scoresError: 'Failed to save score. Please try again.',
          }));
        }

        // Clear from pending saves
        get().pendingSaves.delete(saveKey);
      }
    }, SAVE_DEBOUNCE_MS);

    // Store the timeout ID
    state.pendingSaves.set(saveKey, timeoutId);
  },

  incrementScore: (playerId, holeNumber) => {
    const currentScore = get().scores[playerId]?.[holeNumber] ?? 0;
    get().setScore(playerId, holeNumber, currentScore + 1);
  },

  decrementScore: (playerId, holeNumber) => {
    const currentScore = get().scores[playerId]?.[holeNumber] ?? 2;
    if (currentScore > 1) {
      get().setScore(playerId, holeNumber, currentScore - 1);
    }
  },

  getScore: (playerId, holeNumber) => {
    return get().scores[playerId]?.[holeNumber] ?? null;
  },

  initializeEventScores: async (eventId) => {
    // Skip if already loaded for this event
    if (get().currentEventId === eventId && !get().scoresLoading) {
      return;
    }

    set({ scoresLoading: true, scoresError: null, currentEventId: eventId });

    // For demo events, use mock data directly (works even when Supabase is configured)
    if (eventId === 'demo-event' || eventId.startsWith('demo-')) {
      const scores = initializeScores();
      const userToRound: Record<string, string> = {};
      const roundToUser: Record<string, string> = {};

      for (const round of mockRounds) {
        // Map all mock rounds for demo events
        userToRound[round.userId] = round.id;
        roundToUser[round.id] = round.userId;
      }

      set({
        scores,
        playerRoundMap: userToRound,
        roundToUserMap: roundToUser,
        currentEventId: eventId,
        scoresLoading: false,
      });
      return;
    }

    try {
      // Get rounds mapping and scores in parallel
      const [roundsResult, scoresByRound] = await Promise.all([
        getEventRounds(eventId),
        getScoresForEvent(eventId),
      ]);

      const { userToRound, roundToUser } = roundsResult;

      // Transform scores from roundId-based to userId-based for the store
      const scores: Record<string, Record<number, number>> = {};

      for (const [roundId, holeScores] of Object.entries(scoresByRound)) {
        const userId = roundToUser[roundId];
        if (!userId) continue;

        scores[userId] = {};
        for (const score of holeScores) {
          scores[userId][score.holeNumber] = score.strokes;
        }
      }

      set({
        scores,
        playerRoundMap: userToRound,
        roundToUserMap: roundToUser,
        scoresLoading: false,
      });
    } catch (error) {
      console.error('[scorecardStore] Failed to load scores:', error);
      set({
        scoresError: error instanceof Error ? error.message : 'Failed to load scores',
        scoresLoading: false,
      });
    }
  },

  handleRemoteScoreChange: (roundId, holeNumber, strokes) => {
    const state = get();

    // Check if this is our own change echoed back
    const pendingKey = `${roundId}-${holeNumber}`;
    const pending = state.pendingChanges.get(pendingKey);
    if (pending && pending.strokes === strokes) {
      // This is our own change, ignore it
      return;
    }

    // Find the userId for this roundId
    const userId = state.roundToUserMap[roundId];
    if (!userId) {
      console.warn('[scorecardStore] Received score for unknown round:', roundId);
      return;
    }

    // Apply the remote change
    set((state) => ({
      scores: {
        ...state.scores,
        [userId]: {
          ...state.scores[userId],
          [holeNumber]: strokes,
        },
      },
    }));
  },

  setEventDefaultTee: (teeSetId) => {
    set({ eventDefaultTeeId: teeSetId });
  },

  setPlayerTee: (playerId, teeSetId) => {
    set((state) => ({
      playerTeeOverrides: {
        ...state.playerTeeOverrides,
        [playerId]: teeSetId,
      },
    }));
  },

  clearPlayerTee: (playerId) => {
    set((state) => {
      const { [playerId]: _, ...rest } = state.playerTeeOverrides;
      return { playerTeeOverrides: rest };
    });
  },

  getPlayerTee: (playerId) => {
    const state = get();
    return state.playerTeeOverrides[playerId] ?? state.eventDefaultTeeId;
  },

  loadCourseData: async (eventId) => {
    set({ courseDataLoading: true, courseDataError: null });
    try {
      const data = await getEventTeeSnapshot(eventId);
      set({ courseData: data, courseDataLoading: false });
    } catch (error) {
      set({
        courseDataError: error instanceof Error ? error.message : 'Failed to load course data',
        courseDataLoading: false,
      });
    }
  },

  clearCourseData: () => {
    set({ courseData: null, courseDataLoading: false, courseDataError: null });
  },
}));
