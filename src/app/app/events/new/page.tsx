'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { WizardProgress } from '@/components/events/wizard/WizardProgress';
import {
  StepEventType,
  type EventTypeFormData,
} from '@/components/events/wizard/StepEventType';
import {
  StepDetails,
  type DetailsFormData,
} from '@/components/events/wizard/StepDetails';
import {
  StepGamesAndCourse,
  type GamesAndCourseFormData,
} from '@/components/events/wizard/StepGamesAndCourse';
import { StepReviewNew } from '@/components/events/wizard/StepReviewNew';
import { createEventWithRPC } from '@/lib/services/events';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getCourses, getCourseTeeSets } from '@/lib/services/courses';
import type { Course, TeeSet } from '@/types';

const STEPS = ['Type', 'Details', 'Games', 'Review'];

export default function CreateEventWizardPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Event Type
  const [eventType, setEventType] = useState<EventTypeFormData>({
    style: 'casual',
    numRounds: 1,
    numHoles: 18,
  });

  // Step 2: Details
  const [details, setDetails] = useState<DetailsFormData>({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    expectedPlayers: 4,
    visibility: 'PRIVATE',
  });

  // Step 3: Games & Course
  const [gamesAndCourse, setGamesAndCourse] = useState<GamesAndCourseFormData>({
    allowedGameTypes: ['match_play'],
    defaultStake: 5,
    teeSetId: undefined,
    manualCourse: undefined,
  });

  // Course/tee set names for review display
  const [courses, setCourses] = useState<Course[]>([]);
  const [teeSets, setTeeSets] = useState<TeeSet[]>([]);

  // Load courses for name display
  useEffect(() => {
    getCourses().then(setCourses).catch(console.error);
  }, []);

  // Load tee sets when course is selected
  useEffect(() => {
    if (gamesAndCourse.teeSetId) {
      // Find the course that contains this tee set
      const loadTeeSets = async () => {
        for (const c of courses) {
          try {
            const sets = await getCourseTeeSets(c.id);
            if (sets.some((t) => t.id === gamesAndCourse.teeSetId)) {
              setTeeSets(sets);
              break;
            }
          } catch {
            // Continue to next course
          }
        }
      };
      loadTeeSets();
    }
  }, [gamesAndCourse.teeSetId, courses]);

  // Get course and tee set names for review
  const getCourseName = () => {
    if (!gamesAndCourse.teeSetId) return undefined;
    for (const c of courses) {
      const teeSet = teeSets.find((t) => t.id === gamesAndCourse.teeSetId);
      if (teeSet) return c.name;
    }
    return undefined;
  };

  const getTeeSetName = () => {
    if (!gamesAndCourse.teeSetId) return undefined;
    const teeSet = teeSets.find((t) => t.id === gamesAndCourse.teeSetId);
    return teeSet ? `${teeSet.name} (${teeSet.rating}/${teeSet.slope})` : undefined;
  };

  // Show end date for tournaments or multi-round events
  const showEndDate = eventType.style === 'tournament' || eventType.numRounds > 1;

  const handleSubmit = async () => {
    if (!user?.id) {
      setError('You must be logged in to create a clubhouse');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create the event using RPC (creates event, membership, settings, and teeth balance in one transaction)
      const event = await createEventWithRPC({
        name: details.name,
        date: details.startDate,
        visibility: details.visibility,
        teeSetId: gamesAndCourse.teeSetId,
        // New fields
        endDate: showEndDate ? details.endDate : undefined,
        numRounds: eventType.numRounds,
        numHoles: eventType.numHoles,
        expectedPlayers: details.expectedPlayers,
        allowedGameTypes: gamesAndCourse.allowedGameTypes,
        defaultStake: gamesAndCourse.defaultStake,
        eventStyle: eventType.style,
      });

      // Navigate to the new event
      router.push(`/event/${event.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create clubhouse');
      setIsLoading(false);
    }
  };

  const handleEditStep = (step: number) => {
    setCurrentStep(step + 1); // Steps are 1-indexed
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepEventType
            data={eventType}
            onChange={setEventType}
            onNext={() => setCurrentStep(2)}
          />
        );
      case 2:
        return (
          <StepDetails
            data={details}
            onChange={setDetails}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
            showEndDate={showEndDate}
          />
        );
      case 3:
        return (
          <StepGamesAndCourse
            data={gamesAndCourse}
            onChange={setGamesAndCourse}
            onNext={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
            numHoles={eventType.numHoles}
          />
        );
      case 4:
        return (
          <StepReviewNew
            eventTypeData={eventType}
            detailsData={details}
            gamesData={gamesAndCourse}
            onBack={() => setCurrentStep(3)}
            onSubmit={handleSubmit}
            onEditStep={handleEditStep}
            isSubmitting={isLoading}
            courseName={getCourseName()}
            teeSetName={getTeeSetName()}
          />
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/app" className="text-2xl font-bold text-primary">
            Press!
          </Link>
          <span className="text-muted-foreground">Create Clubhouse</span>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Progress */}
        <WizardProgress currentStep={currentStep} steps={STEPS} />

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-md bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="rounded-lg border bg-card p-6">
          {renderStep()}
        </div>
      </div>
    </main>
  );
}
