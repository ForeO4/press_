import { create } from 'zustand';
import { mockScores, mockRounds } from '@/lib/mock/data';

interface SelectedCell {
  playerId: string;
  holeNumber: number;
}

interface ScorecardStore {
  // Scores indexed by playerId, then holeNumber
  scores: Record<string, Record<number, number>>;
  selectedCell: SelectedCell | null;
  isEditorOpen: boolean;

  // Actions
  selectCell: (playerId: string, holeNumber: number) => void;
  clearSelection: () => void;
  openEditor: () => void;
  closeEditor: () => void;
  setScore: (playerId: string, holeNumber: number, strokes: number) => void;
  incrementScore: (playerId: string, holeNumber: number) => void;
  decrementScore: (playerId: string, holeNumber: number) => void;
  getScore: (playerId: string, holeNumber: number) => number | null;
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
}));
