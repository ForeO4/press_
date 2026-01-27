'use client';

import { CourseSelector } from '@/components/courses/CourseSelector';
import { Button } from '@/components/ui/button';

export interface CourseFormData {
  teeSetId: string | undefined;
}

interface StepCourseProps {
  data: CourseFormData;
  onChange: (data: CourseFormData) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepCourse({ data, onChange, onNext, onBack }: StepCourseProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Course Selection</h2>
        <p className="text-sm text-muted-foreground">
          Choose a course and tee set for this event. You can skip this for now.
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <CourseSelector
          value={data.teeSetId}
          onChange={(teeSetId) => onChange({ ...data, teeSetId })}
        />
      </div>

      <div className="rounded-lg bg-muted/50 p-4">
        <h3 className="text-sm font-medium text-foreground">Why select a course?</h3>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>- Hole-by-hole par information for scoring</li>
          <li>- Course handicap calculations</li>
          <li>- Proper tee selection for different skill levels</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onNext}>
            Skip for Now
          </Button>
          <Button onClick={onNext} disabled={!data.teeSetId}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
