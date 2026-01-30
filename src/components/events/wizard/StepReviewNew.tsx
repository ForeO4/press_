'use client';

import {
  Calendar,
  Check,
  Edit2,
  Eye,
  Flag,
  MapPin,
  Trophy,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EventTypeFormData } from './StepEventType';
import { DetailsFormData } from './StepDetails';
import { GamesAndCourseFormData } from './StepGamesAndCourse';

interface StepReviewNewProps {
  eventTypeData: EventTypeFormData;
  detailsData: DetailsFormData;
  gamesData: GamesAndCourseFormData;
  onBack: () => void;
  onSubmit: () => void;
  onEditStep: (step: number) => void;
  isSubmitting: boolean;
  courseName?: string;
  teeSetName?: string;
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatGameType(type: string): string {
  const names: Record<string, string> = {
    match_play: 'Match Play',
    nassau: 'Nassau',
    skins: 'Skins',
  };
  return names[type] || type;
}

function formatVisibility(visibility: string): string {
  const names: Record<string, string> = {
    PRIVATE: 'Private',
    UNLISTED: 'Unlisted',
    PUBLIC: 'Public',
  };
  return names[visibility] || visibility;
}

export function StepReviewNew({
  eventTypeData,
  detailsData,
  gamesData,
  onBack,
  onSubmit,
  onEditStep,
  isSubmitting,
  courseName,
  teeSetName,
}: StepReviewNewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Review Your Event
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Make sure everything looks good before creating
        </p>
      </div>

      {/* Event Type Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium">Event Type</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-muted-foreground"
            onClick={() => onEditStep(0)}
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            {eventTypeData.style === 'casual' ? (
              <Flag className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Trophy className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="font-medium capitalize">
              {eventTypeData.style === 'casual'
                ? 'Casual Round'
                : 'Tournament'}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>
              {eventTypeData.numRounds} round
              {eventTypeData.numRounds !== 1 ? 's' : ''}
            </span>
            <span>{eventTypeData.numHoles} holes per round</span>
          </div>
        </CardContent>
      </Card>

      {/* Details Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium">Details</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-muted-foreground"
            onClick={() => onEditStep(1)}
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-semibold text-foreground">{detailsData.name}</h3>
            {detailsData.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {detailsData.description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(detailsData.startDate)}
                {detailsData.endDate &&
                  detailsData.endDate !== detailsData.startDate && (
                    <> - {formatDate(detailsData.endDate)}</>
                  )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{detailsData.expectedPlayers} players</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>{formatVisibility(detailsData.visibility)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Games & Course Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium">
            Games & Course
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-muted-foreground"
            onClick={() => onEditStep(2)}
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Game Types */}
          <div>
            <p className="text-sm text-muted-foreground">Game Formats</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {gamesData.allowedGameTypes.map((type) => (
                <span
                  key={type}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary"
                >
                  <Check className="h-3 w-3" />
                  {formatGameType(type)}
                </span>
              ))}
            </div>
          </div>

          {/* Stake */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Default Stake:</span>
            <span className="font-medium">
              {gamesData.defaultStake > 0
                ? `$${gamesData.defaultStake}`
                : 'No stake'}
            </span>
          </div>

          {/* Course */}
          {(courseName || gamesData.manualCourse?.courseName) && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>
                {courseName || gamesData.manualCourse?.courseName}
                {teeSetName && (
                  <span className="text-muted-foreground"> ({teeSetName})</span>
                )}
              </span>
            </div>
          )}
          {!courseName && !gamesData.manualCourse?.courseName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>No course selected</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info message */}
      <div className="rounded-lg bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          You can always change these settings after creating the event.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Clubhouse'}
        </Button>
      </div>
    </div>
  );
}
