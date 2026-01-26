'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScorecardTable } from '@/components/scorecard';
import { mockCourse } from '@/lib/mock/course';

export default function ScorecardPage({
  params,
}: {
  params: { eventId: string };
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Scorecard</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{mockCourse.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Par {mockCourse.totalPar} &bull; 18 Holes
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
