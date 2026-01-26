'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScorecardTable } from '@/components/scorecard';
import { useScorecardStore } from '@/stores/scorecardStore';
import { useScoreSync } from '@/hooks/useScoreSync';

export default function ScorecardPage({
  params,
}: {
  params: { eventId: string };
}) {
  const {
    loadCourseData,
    initializeEventScores,
    courseData,
    courseDataLoading,
    scoresLoading,
  } = useScorecardStore();

  // Initialize scores and realtime sync
  const { status: syncStatus } = useScoreSync({
    eventId: params.eventId,
  });

  // Load course data and scores when page mounts
  useEffect(() => {
    loadCourseData(params.eventId);
    initializeEventScores(params.eventId);
  }, [params.eventId, loadCourseData, initializeEventScores]);

  // Calculate totals from course data
  const holes = courseData?.holes ?? [];
  const totalPar = holes.reduce((sum, h) => sum + h.par, 0);
  const totalYardage = holes.reduce((sum, h) => sum + h.yardage, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Scorecard</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            {courseDataLoading ? 'Loading...' : courseData?.courseName ?? 'Course'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {courseData && (
              <>
                Par {totalPar} &bull; {totalYardage.toLocaleString()} yards (
                {courseData.teeSetName}) &bull; 18 Holes
              </>
            )}
          </p>
        </CardHeader>
        <CardContent className="px-0 pb-4">
          <ScorecardTable />
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Tap any score to edit
      </p>
    </div>
  );
}
