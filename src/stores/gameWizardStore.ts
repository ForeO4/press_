import { create } from 'zustand';
import type { GameType, GuestPlayer } from '@/types';

/**
 * Game wizard step
 */
export type GameWizardStep = 'type' | 'course' | 'players' | 'confirm';

/**
 * Guest player input (before creation)
 */
export interface GuestPlayerInput {
  tempId: string;
  name: string;
  handicapIndex?: number;
}

/**
 * Game wizard store for multi-step game creation flow
 */
interface GameWizardStore {
  // Context
  eventId: string | null;
  clubhouseId: string | null;

  // Wizard state
  currentStep: GameWizardStep;
  isSubmitting: boolean;
  error: string | null;

  // Step 1: Game Type
  gameType: GameType | null;
  stakeBucks: number;

  // Step 2: Course Selection
  courseId: string | null;
  teeSetId: string | null;

  // Step 3: Player Selection
  playerIds: string[]; // Existing user IDs
  guestPlayers: GuestPlayerInput[]; // New guests to create

  // Actions - Context
  setContext: (eventId: string | null, clubhouseId?: string | null) => void;

  // Actions - Navigation
  setStep: (step: GameWizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Actions - Step 1
  setGameType: (type: GameType) => void;
  setStakeBucks: (bucks: number) => void;

  // Actions - Step 2
  setCourse: (courseId: string | null, teeSetId: string | null) => void;

  // Actions - Step 3
  addPlayer: (userId: string) => void;
  removePlayer: (userId: string) => void;
  addGuestPlayer: (guest: GuestPlayerInput) => void;
  removeGuestPlayer: (tempId: string) => void;
  updateGuestPlayer: (tempId: string, updates: Partial<GuestPlayerInput>) => void;

  // Actions - Submission
  setSubmitting: (isSubmitting: boolean) => void;
  setError: (error: string | null) => void;

  // Actions - Reset
  reset: () => void;
  resetToStep: (step: GameWizardStep) => void;

  // Computed helpers
  getAllPlayerIds: () => string[];
  getTotalPlayerCount: () => number;
  canProceed: () => boolean;
}

const STEP_ORDER: GameWizardStep[] = ['type', 'course', 'players', 'confirm'];

const initialState = {
  eventId: null as string | null,
  clubhouseId: null as string | null,
  currentStep: 'type' as GameWizardStep,
  isSubmitting: false,
  error: null as string | null,
  gameType: null as GameType | null,
  stakeBucks: 10,
  courseId: null as string | null,
  teeSetId: null as string | null,
  playerIds: [] as string[],
  guestPlayers: [] as GuestPlayerInput[],
};

export const useGameWizardStore = create<GameWizardStore>((set, get) => ({
  ...initialState,

  // Context
  setContext: (eventId, clubhouseId = null) =>
    set({ eventId, clubhouseId }),

  // Navigation
  setStep: (step) => set({ currentStep: step, error: null }),

  nextStep: () => {
    const { currentStep } = get();
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      set({ currentStep: STEP_ORDER[currentIndex + 1], error: null });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      set({ currentStep: STEP_ORDER[currentIndex - 1], error: null });
    }
  },

  // Step 1: Game Type
  setGameType: (type) => set({ gameType: type }),
  setStakeBucks: (bucks) => set({ stakeBucks: Math.max(0, Math.round(bucks)) }),

  // Step 2: Course
  setCourse: (courseId, teeSetId) => set({ courseId, teeSetId }),

  // Step 3: Players
  addPlayer: (userId) => {
    const { playerIds } = get();
    if (!playerIds.includes(userId)) {
      set({ playerIds: [...playerIds, userId] });
    }
  },

  removePlayer: (userId) => {
    const { playerIds } = get();
    set({ playerIds: playerIds.filter((id) => id !== userId) });
  },

  addGuestPlayer: (guest) => {
    const { guestPlayers } = get();
    set({ guestPlayers: [...guestPlayers, guest] });
  },

  removeGuestPlayer: (tempId) => {
    const { guestPlayers } = get();
    set({ guestPlayers: guestPlayers.filter((g) => g.tempId !== tempId) });
  },

  updateGuestPlayer: (tempId, updates) => {
    const { guestPlayers } = get();
    set({
      guestPlayers: guestPlayers.map((g) =>
        g.tempId === tempId ? { ...g, ...updates } : g
      ),
    });
  },

  // Submission
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  setError: (error) => set({ error }),

  // Reset
  reset: () => set(initialState),

  resetToStep: (step) => {
    const { eventId, clubhouseId, gameType, stakeBucks, courseId, teeSetId, playerIds, guestPlayers } = get();
    const stepIndex = STEP_ORDER.indexOf(step);

    // Keep state for steps before the target, clear state for steps at/after target
    set({
      ...initialState,
      eventId,
      clubhouseId,
      currentStep: step,
      // Keep step 1 data if resetting to step 2+
      gameType: stepIndex > 0 ? gameType : null,
      stakeBucks: stepIndex > 0 ? stakeBucks : 10,
      // Keep step 2 data if resetting to step 3+
      courseId: stepIndex > 1 ? courseId : null,
      teeSetId: stepIndex > 1 ? teeSetId : null,
      // Keep step 3 data if resetting to confirm
      playerIds: stepIndex > 2 ? playerIds : [],
      guestPlayers: stepIndex > 2 ? guestPlayers : [],
    });
  },

  // Computed
  getAllPlayerIds: () => {
    const { playerIds, guestPlayers } = get();
    const guestIds = guestPlayers.map((g) => `guest-temp-${g.tempId}`);
    return [...playerIds, ...guestIds];
  },

  getTotalPlayerCount: () => {
    const { playerIds, guestPlayers } = get();
    return playerIds.length + guestPlayers.length;
  },

  canProceed: () => {
    const { currentStep, gameType, playerIds, guestPlayers } = get();

    switch (currentStep) {
      case 'type':
        return gameType !== null;
      case 'course':
        // Course is optional for some game types
        return true;
      case 'players':
        // Need at least 2 players
        return playerIds.length + guestPlayers.length >= 2;
      case 'confirm':
        return true;
      default:
        return false;
    }
  },
}));
