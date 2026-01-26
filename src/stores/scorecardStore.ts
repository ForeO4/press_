import { create } from 'zustand';
import { mockScores, mockRounds } from '@/lib/mock/data';
import { getEventTeeSnapshot } from '@/lib/services/courses';
import type { TeeSnapshot } from '@/types';

interface SelectedCell {
  playerId: string;
  holeNumber: number;
}

interface ScorecardStore {
  // Scores indexed by playerId, then holeNumber
  scores: Record<string, Record<number, number>>;
  selectedCell: SelectedCell | null;
  isEditorOpen: boolean;

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

export const useScorecardStore = create<ScorecardStore>((set, get) => ({
  scores: initializeScores(),
  selectedCell: null,
  isEditorOpen: false,
  eventDefaultTeeId: 'tee-set-blue',
  playerTeeOverrides: {},
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
    set((state) => ({
      scores: {
        ...state.scores,
        [playerId]: {
          ...state.scores[playerId],
          [holeNumber]: strokes,
        },
      },
    }));
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
