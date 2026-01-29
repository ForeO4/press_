'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { WizardProgress } from '@/components/events/wizard/WizardProgress';
import { StepBasics, type BasicFormData } from '@/components/events/wizard/StepBasics';
import { StepCourse, type CourseFormData } from '@/components/events/wizard/StepCourse';
import { StepRules, type RulesFormData } from '@/components/events/wizard/StepRules';
import { StepReview } from '@/components/events/wizard/StepReview';
import { createEventWithRPC } from '@/lib/services/events';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getCourses, getCourseTeeSets } from '@/lib/services/courses';
import { DEFAULT_AUTO_PRESS_CONFIG } from '@/lib/domain/games/autoPress';
import type { Course, TeeSet } from '@/types';

const STEPS = ['Basics', 'Course', 'Rules', 'Review'];

export default function CreateEventWizardPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data for each step
  const [basics, setBasics] = useState<BasicFormData>({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    visibility: 'PRIVATE',
  });

  const [course, setCourse] = useState<CourseFormData>({
    teeSetId: undefined,
  });

  const [rules, setRules] = useState<RulesFormData>({
    allowedGameTypes: ['nassau'],
    defaultStake: 5,
    autoPressConfig: DEFAULT_AUTO_PRESS_CONFIG,
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
    if (course.teeSetId) {
      // Find the course that contains this tee set
      const loadTeeSets = async () => {
        for (const c of courses) {
          try {
            const sets = await getCourseTeeSets(c.id);
            if (sets.some((t) => t.id === course.teeSetId)) {
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
  }, [course.teeSetId, courses]);

  // Get course and tee set names for review
  const getCourseName = () => {
    if (!course.teeSetId) return undefined;
    for (const c of courses) {
      const teeSet = teeSets.find((t) => t.id === course.teeSetId);
      if (teeSet) return c.name;
    }
    return undefined;
  };

  const getTeeSetName = () => {
    if (!course.teeSetId) return undefined;
    const teeSet = teeSets.find((t) => t.id === course.teeSetId);
    return teeSet ? `${teeSet.name} (${teeSet.rating}/${teeSet.slope})` : undefined;
  };

  const handleCancel = () => {
    router.push('/app');
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      setError('You must be logged in to create a clubhouse');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create the event using RPC (creates event, membership, settings, and teeth balance)
      const event = await createEventWithRPC({
        name: basics.name,
        date: basics.startDate,
        visibility: basics.visibility,
        teeSetId: course.teeSetId,
      });

      // Navigate to the new event
      router.push(`/event/${event.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create clubhouse');
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepBasics
            data={basics}
            onChange={setBasics}
            onNext={() => setCurrentStep(2)}
            onCancel={handleCancel}
          />
        );
      case 2:
        return (
          <StepCourse
            data={course}
            onChange={setCourse}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        );
      case 3:
        return (
          <StepRules
            data={rules}
            onChange={setRules}
            onNext={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
          />
        );
      case 4:
        return (
          <StepReview
            basics={basics}
            course={course}
            rules={rules}
            courseName={getCourseName()}
            teeSetName={getTeeSetName()}
            onBack={() => setCurrentStep(3)}
            onSubmit={handleSubmit}
            isLoading={isLoading}
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
