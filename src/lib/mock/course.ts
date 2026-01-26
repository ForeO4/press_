/**
 * Mock course data with 18-hole layout
 */

export interface CourseHole {
  number: number; // 1-18
  par: number; // 3, 4, or 5
}

export interface MockCourse {
  id: string;
  name: string;
  holes: CourseHole[];
  frontPar: number;
  backPar: number;
  totalPar: number;
}

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
