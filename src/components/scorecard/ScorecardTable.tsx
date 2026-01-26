'use client';

import { ScorecardRow } from './ScorecardRow';
import { ScoreEditorSheet } from './ScoreEditorSheet';
import { mockCourse, getFrontNine, getBackNine } from '@/lib/mock/course';
import { mockUsers } from '@/lib/mock/users';

/**
 * Full 18-hole scorecard table with sticky player column
 */
export function ScorecardTable() {
  const frontNine = getFrontNine();
  const backNine = getBackNine();

  return (
    <div className="relative">
      {/* Scrollable table container */}
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            {/* Hole number row */}
            <tr className="border-b">
              <th className="sticky left-0 z-10 bg-background py-2 text-left font-medium min-w-[80px]">
                Hole
              </th>
              {/* Front 9 holes */}
              {frontNine.map((hole) => (
                <th
                  key={hole.number}
                  className="px-2 py-2 text-center font-medium min-w-[44px]"
                >
                  {hole.number}
                </th>
              ))}
              <th className="px-2 py-2 text-center font-bold bg-muted/50 min-w-[44px]">
                OUT
              </th>
              {/* Back 9 holes */}
              {backNine.map((hole) => (
                <th
                  key={hole.number}
                  className="px-2 py-2 text-center font-medium min-w-[44px]"
                >
                  {hole.number}
                </th>
              ))}
              <th className="px-2 py-2 text-center font-bold bg-muted/50 min-w-[44px]">
                IN
              </th>
              <th className="px-2 py-2 text-center font-bold bg-muted min-w-[52px]">
                TOT
              </th>
            </tr>

            {/* Par row */}
            <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
              <td className="sticky left-0 z-10 bg-muted/30 py-1">Par</td>
              {/* Front 9 pars */}
              {frontNine.map((hole) => (
                <td key={hole.number} className="px-2 py-1 text-center">
                  {hole.par}
                </td>
              ))}
              <td className="px-2 py-1 text-center font-medium bg-muted/50">
                {mockCourse.frontPar}
              </td>
              {/* Back 9 pars */}
              {backNine.map((hole) => (
                <td key={hole.number} className="px-2 py-1 text-center">
                  {hole.par}
                </td>
              ))}
              <td className="px-2 py-1 text-center font-medium bg-muted/50">
                {mockCourse.backPar}
              </td>
              <td className="px-2 py-1 text-center font-medium bg-muted">
                {mockCourse.totalPar}
              </td>
            </tr>
          </thead>

          <tbody>
            {mockUsers.map((user) => (
              <ScorecardRow
                key={user.id}
                playerId={user.id}
                playerName={user.name}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Score editor sheet */}
      <ScoreEditorSheet />
    </div>
  );
}
