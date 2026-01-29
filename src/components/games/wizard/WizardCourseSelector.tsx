'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useGameWizardStore } from '@/stores/gameWizardStore';
import { getCourses, getCourseTeeSets } from '@/lib/services/courses';
import type { Course, TeeSet } from '@/types';
import { ArrowLeft, Search, MapPin, Check } from 'lucide-react';

export function WizardCourseSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');

  const { courseId, teeSetId, setCourse, nextStep, prevStep } = useGameWizardStore();

  const [courses, setCourses] = useState<Course[]>([]);
  const [teeSets, setTeeSets] = useState<TeeSet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Load courses
  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await getCourses();
        setCourses(data);

        // If courseId is set, load its tee sets
        if (courseId) {
          const course = data.find((c) => c.id === courseId);
          if (course) {
            setSelectedCourse(course);
            const tees = await getCourseTeeSets(courseId);
            setTeeSets(tees);
          }
        }
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, [courseId]);

  const handleSelectCourse = async (course: Course) => {
    setSelectedCourse(course);
    setCourse(course.id, null);

    try {
      const tees = await getCourseTeeSets(course.id);
      setTeeSets(tees);
    } catch (err) {
      console.error('Failed to load tee sets:', err);
      setTeeSets([]);
    }
  };

  const handleSelectTee = (tee: TeeSet) => {
    if (selectedCourse) {
      setCourse(selectedCourse.id, tee.id);
    }
  };

  const handleContinue = () => {
    nextStep();
    router.push(`/game/new/players${eventId ? `?eventId=${eventId}` : ''}`);
  };

  const handleBack = () => {
    prevStep();
    router.push(`/game/new/type${eventId ? `?eventId=${eventId}` : ''}`);
  };

  const handleSkip = () => {
    setCourse(null, null);
    nextStep();
    router.push(`/game/new/players${eventId ? `?eventId=${eventId}` : ''}`);
  };

  const filteredCourses = courses.filter((course) =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-background p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">New Game</h1>
          <p className="text-sm text-muted-foreground">Step 2 of 3: Course</p>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Selected Course & Tee Set */}
        {selectedCourse && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{selectedCourse.name}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {selectedCourse.city}, {selectedCourse.state}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-sm text-muted-foreground mb-2">Select tees:</p>
              <div className="flex flex-wrap gap-2">
                {teeSets.map((tee) => (
                  <Button
                    key={tee.id}
                    variant={teeSetId === tee.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSelectTee(tee)}
                  >
                    {tee.name}
                    {tee.rating && (
                      <span className="ml-1 text-xs opacity-70">
                        ({tee.rating}/{tee.slope})
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course List */}
        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
            <CardDescription>
              {selectedCourse ? 'Change course' : 'Select a course'}
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-64 overflow-y-auto space-y-2">
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 animate-pulse bg-muted rounded" />
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No courses found
              </p>
            ) : (
              filteredCourses.slice(0, 10).map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => handleSelectCourse(course)}
                  className={`w-full p-3 rounded-lg border text-left transition-colors flex items-center justify-between ${
                    courseId === course.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div>
                    <p className="font-medium text-foreground">{course.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {course.city}, {course.state}
                    </p>
                  </div>
                  {courseId === course.id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleSkip}>
            Skip
          </Button>
          <Button className="flex-1" onClick={handleContinue}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
