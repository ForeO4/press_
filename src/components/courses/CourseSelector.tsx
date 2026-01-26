'use client';

import { useState, useEffect } from 'react';
import { getCourses, getCourseTeeSets } from '@/lib/services/courses';
import type { Course, TeeSet } from '@/types';

interface CourseSelectorProps {
  value?: string; // Selected teeSetId
  onChange: (teeSetId: string | undefined) => void;
  disabled?: boolean;
}

const selectClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export function CourseSelector({
  value,
  onChange,
  disabled = false,
}: CourseSelectorProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teeSets, setTeeSets] = useState<TeeSet[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load courses on mount
  useEffect(() => {
    async function loadCourses() {
      setLoading(true);
      setError(null);
      try {
        const data = await getCourses();
        setCourses(data);
      } catch (err) {
        setError('Failed to load courses');
        console.error('[CourseSelector] Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, []);

  // Load tee sets when course changes
  useEffect(() => {
    async function loadTeeSets() {
      if (!selectedCourseId) {
        setTeeSets([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getCourseTeeSets(selectedCourseId);
        setTeeSets(data);
      } catch (err) {
        setError('Failed to load tee sets');
        console.error('[CourseSelector] Failed to load tee sets:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTeeSets();
  }, [selectedCourseId]);

  // Clear tee set selection when course changes
  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    onChange(undefined); // Clear tee set selection
  };

  const handleTeeSetChange = (teeSetId: string) => {
    onChange(teeSetId || undefined);
  };

  return (
    <div className="space-y-3">
      <div>
        <label
          htmlFor="course-select"
          className="block text-sm font-medium text-foreground"
        >
          Course (Optional)
        </label>
        <select
          id="course-select"
          value={selectedCourseId}
          onChange={(e) => handleCourseChange(e.target.value)}
          className={`${selectClassName} mt-1`}
          disabled={disabled || loading}
        >
          <option value="">Select a course...</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name} - {course.city}, {course.state}
            </option>
          ))}
        </select>
      </div>

      {selectedCourseId && (
        <div>
          <label
            htmlFor="tee-set-select"
            className="block text-sm font-medium text-foreground"
          >
            Tee Set
          </label>
          <select
            id="tee-set-select"
            value={value || ''}
            onChange={(e) => handleTeeSetChange(e.target.value)}
            className={`${selectClassName} mt-1`}
            disabled={disabled || loading || teeSets.length === 0}
          >
            <option value="">Select a tee set...</option>
            {teeSets.map((teeSet) => (
              <option key={teeSet.id} value={teeSet.id}>
                {teeSet.name} ({teeSet.rating}/{teeSet.slope})
              </option>
            ))}
          </select>
          {teeSets.length === 0 && !loading && (
            <p className="mt-1 text-sm text-muted-foreground">
              No tee sets available for this course
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
