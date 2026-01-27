'use client';

import { useState, useEffect } from 'react';
import { getCourses, getCourseTeeSets } from '@/lib/services/courses';
import type { Course, TeeSet } from '@/types';

export interface ManualCourseData {
  courseName: string;
  slopeRating: number;
  courseRating?: number;
}

interface CourseSelectorProps {
  value?: string; // Selected teeSetId
  onChange: (teeSetId: string | undefined) => void;
  onManualCourseChange?: (data: ManualCourseData | undefined) => void;
  manualCourse?: ManualCourseData;
  disabled?: boolean;
}

const selectClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export function CourseSelector({
  value,
  onChange,
  onManualCourseChange,
  manualCourse,
  disabled = false,
}: CourseSelectorProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teeSets, setTeeSets] = useState<TeeSet[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(!!manualCourse);
  const [manualData, setManualData] = useState<ManualCourseData>(
    manualCourse || { courseName: '', slopeRating: 113 }
  );

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

  const handleManualInputToggle = () => {
    const newShowManual = !showManualInput;
    setShowManualInput(newShowManual);
    if (newShowManual) {
      // Switching to manual - clear course selection
      setSelectedCourseId('');
      onChange(undefined);
      onManualCourseChange?.(manualData);
    } else {
      // Switching to course list - clear manual data
      onManualCourseChange?.(undefined);
    }
  };

  const handleManualDataChange = (field: keyof ManualCourseData, value: string | number | undefined) => {
    const updated = { ...manualData, [field]: value };
    setManualData(updated);
    onManualCourseChange?.(updated);
  };

  const inputClassName =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

  // Show manual input form
  if (showManualInput) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Manual Course Entry</h3>
          <button
            type="button"
            onClick={handleManualInputToggle}
            className="text-sm text-primary hover:underline"
          >
            Search courses instead
          </button>
        </div>

        <div>
          <label htmlFor="manual-course-name" className="block text-sm font-medium text-foreground">
            Course Name *
          </label>
          <input
            id="manual-course-name"
            type="text"
            value={manualData.courseName}
            onChange={(e) => handleManualDataChange('courseName', e.target.value)}
            placeholder="e.g., Pine Valley Golf Club"
            className={`${inputClassName} mt-1`}
            disabled={disabled}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="manual-slope" className="block text-sm font-medium text-foreground">
              Slope Rating *
            </label>
            <input
              id="manual-slope"
              type="number"
              min={55}
              max={155}
              value={manualData.slopeRating}
              onChange={(e) => handleManualDataChange('slopeRating', parseInt(e.target.value) || 113)}
              className={`${inputClassName} mt-1`}
              disabled={disabled}
            />
            <p className="mt-1 text-xs text-muted-foreground">55-155, default 113</p>
          </div>

          <div>
            <label htmlFor="manual-rating" className="block text-sm font-medium text-foreground">
              Course Rating
            </label>
            <input
              id="manual-rating"
              type="number"
              step="0.1"
              min={60}
              max={80}
              value={manualData.courseRating || ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                handleManualDataChange('courseRating', isNaN(val) ? undefined : val);
              }}
              placeholder="Optional"
              className={`${inputClassName} mt-1`}
              disabled={disabled}
            />
            <p className="mt-1 text-xs text-muted-foreground">e.g., 72.5</p>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Error state with manual entry option */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
          <button
            type="button"
            onClick={handleManualInputToggle}
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            Enter course manually
          </button>
        </div>
      )}

      {/* Show manual option when no courses available */}
      {!error && !loading && courses.length === 0 && (
        <div className="rounded-md bg-muted p-3">
          <p className="text-sm text-muted-foreground">No courses available in the database.</p>
          <button
            type="button"
            onClick={handleManualInputToggle}
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            Enter course manually
          </button>
        </div>
      )}

      {/* Always show manual option at bottom */}
      {!error && (loading || courses.length > 0) && (
        <button
          type="button"
          onClick={handleManualInputToggle}
          className="text-sm text-muted-foreground hover:text-primary hover:underline"
        >
          or enter course manually
        </button>
      )}
    </div>
  );
}
