'use client';

import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import type { BasicFormData } from './StepBasics';
import type { CourseFormData } from './StepCourse';
import type { RulesFormData } from './StepRules';

interface StepReviewProps {
  basics: BasicFormData;
  course: CourseFormData;
  rules: RulesFormData;
  courseName?: string;
  teeSetName?: string;
  onBack: () => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function StepReview({
  basics,
  course,
  rules,
  courseName,
  teeSetName,
  onBack,
  onSubmit,
  isLoading,
}: StepReviewProps) {
  const gameTypeLabels = {
    match_play: 'Match Play',
    nassau: 'Nassau',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Review & Create</h2>
        <p className="text-sm text-muted-foreground">
          Review your clubhouse settings before creating.
        </p>
      </div>

      {/* Event Details */}
      <div className="rounded-lg border divide-y">
        {/* Basics */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Clubhouse Details
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-foreground font-medium">{basics.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  basics.visibility === 'PUBLIC'
                    ? 'bg-success/20 text-success'
                    : basics.visibility === 'UNLISTED'
                      ? 'bg-info/20 text-info'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {basics.visibility}
              </span>
            </div>
            {basics.description && (
              <p className="text-sm text-muted-foreground">{basics.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {formatDate(basics.startDate)}
              {basics.endDate && basics.endDate !== basics.startDate
                ? ` - ${formatDate(basics.endDate)}`
                : ''}
            </p>
          </div>
        </div>

        {/* Course */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Course
          </h3>
          {course.teeSetId ? (
            <div>
              <p className="text-foreground">{courseName || 'Selected course'}</p>
              {teeSetName && (
                <p className="text-sm text-muted-foreground">{teeSetName}</p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground italic">No course selected</p>
          )}
        </div>

        {/* Game Rules */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Game Rules
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Game Types:</span>
              <span className="text-foreground">
                {rules.allowedGameTypes
                  .map((t) => gameTypeLabels[t])
                  .join(', ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Default Stake:</span>
              <span className="text-foreground">{rules.defaultStake} Bucks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Auto-Press:</span>
              <span className="text-foreground">
                {rules.autoPressConfig.enabled
                  ? `${rules.autoPressConfig.trigger} down, max ${rules.autoPressConfig.maxPresses}`
                  : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-foreground">Ready to create</h4>
            <p className="text-sm text-muted-foreground">
              You can edit these settings anytime after creating the clubhouse.
              Invite players and start tracking games right away.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button onClick={onSubmit} disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Clubhouse'}
        </Button>
      </div>
    </div>
  );
}
