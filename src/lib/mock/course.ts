/**
 * Mock course data with 18-hole layout
 */

export interface CourseHole {
  number: number; // 1-18
  par: number; // 3, 4, or 5
}

export interface MockTeeSet {
  id: string;
  name: string; // "Blue", "White", "Red"
  color: string; // For UI: "#1e40af"
  rating: number; // 72.1
  slope: number; // 131
  yardages: number[]; // 18 values, index 0 = hole 1
  handicaps: number[]; // 18 values, stroke index (1-18)
}

export interface MockCourse {
  id: string;
  name: string;
  holes: CourseHole[];
  frontPar: number;
  backPar: number;
  totalPar: number;
  teeSets: MockTeeSet[];
}

export const mockTeeSets: MockTeeSet[] = [
  {
    id: 'tee-set-blue',
    name: 'Blue',
    color: '#1e40af',
    rating: 73.2,
    slope: 138,
    yardages: [427, 380, 178, 412, 195, 398, 542, 389, 421, 399, 172, 518, 385, 428, 167, 402, 534, 418],
    handicaps: [3, 9, 17, 5, 15, 11, 1, 7, 13, 4, 18, 2, 10, 6, 16, 12, 8, 14],
  },
  {
    id: 'tee-set-white',
    name: 'White',
    color: '#6b7280',
    rating: 71.1,
    slope: 131,
    yardages: [398, 356, 162, 388, 175, 372, 512, 365, 395, 375, 158, 492, 361, 402, 153, 378, 508, 394],
    handicaps: [3, 9, 17, 5, 15, 11, 1, 7, 13, 4, 18, 2, 10, 6, 16, 12, 8, 14],
  },
  {
    id: 'tee-set-red',
    name: 'Red',
    color: '#dc2626',
    rating: 68.4,
    slope: 121,
    yardages: [352, 312, 138, 342, 148, 328, 468, 322, 351, 332, 138, 448, 318, 358, 128, 335, 462, 352],
    handicaps: [3, 9, 17, 5, 15, 11, 1, 7, 13, 4, 18, 2, 10, 6, 16, 12, 8, 14],
  },
];

export const mockCourse: MockCourse = {
  id: 'course-demo',
  name: 'Pine Valley Golf Club',
  holes: [
    // Front 9
    { number: 1, par: 4 },
    { number: 2, par: 4 },
    { number: 3, par: 3 },
    { number: 4, par: 4 },
    { number: 5, par: 3 },
    { number: 6, par: 4 },
    { number: 7, par: 5 },
    { number: 8, par: 4 },
    { number: 9, par: 4 },
    // Back 9
    { number: 10, par: 4 },
    { number: 11, par: 3 },
    { number: 12, par: 5 },
    { number: 13, par: 4 },
    { number: 14, par: 4 },
    { number: 15, par: 3 },
    { number: 16, par: 4 },
    { number: 17, par: 5 },
    { number: 18, par: 4 },
  ],
  frontPar: 35,
  backPar: 36,
  totalPar: 71,
  teeSets: mockTeeSets,
};

/**
 * Get par for a specific hole
 */
export function getHolePar(holeNumber: number): number {
  const hole = mockCourse.holes.find((h) => h.number === holeNumber);
  return hole?.par ?? 4;
}

/**
 * Get front 9 holes
 */
export function getFrontNine(): CourseHole[] {
  return mockCourse.holes.filter((h) => h.number <= 9);
}

/**
 * Get back 9 holes
 */
export function getBackNine(): CourseHole[] {
  return mockCourse.holes.filter((h) => h.number > 9);
}

/**
 * Get tee set by ID
 */
export function getTeeSet(teeSetId: string): MockTeeSet | undefined {
  return mockTeeSets.find((t) => t.id === teeSetId);
}

/**
 * Get yardage for a specific hole from a tee set
 */
export function getHoleYardage(teeSetId: string, holeNumber: number): number {
  const teeSet = getTeeSet(teeSetId);
  if (!teeSet || holeNumber < 1 || holeNumber > 18) return 0;
  return teeSet.yardages[holeNumber - 1];
}

/**
 * Get front 9 total yardage for a tee set
 */
export function getFrontYardage(teeSetId: string): number {
  const teeSet = getTeeSet(teeSetId);
  if (!teeSet) return 0;
  return teeSet.yardages.slice(0, 9).reduce((sum, y) => sum + y, 0);
}

/**
 * Get back 9 total yardage for a tee set
 */
export function getBackYardage(teeSetId: string): number {
  const teeSet = getTeeSet(teeSetId);
  if (!teeSet) return 0;
  return teeSet.yardages.slice(9, 18).reduce((sum, y) => sum + y, 0);
}

/**
 * Get total yardage for a tee set
 */
export function getTotalYardage(teeSetId: string): number {
  const teeSet = getTeeSet(teeSetId);
  if (!teeSet) return 0;
  return teeSet.yardages.reduce((sum, y) => sum + y, 0);
}
