'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCourses, getCourseTeeSets, searchCourses, getTeeSetWithHoles, getCourse } from '@/lib/services/courses';
import { CourseEntryForm } from './CourseEntryForm';
import type { Course, TeeSet } from '@/types';

export interface ManualCourseData {
  courseName: string;
  slopeRating: number;
  courseRating?: number;
  par?: number;
}

interface CourseSelectorProps {
  value?: string; // Selected teeSetId
  onChange: (teeSetId: string | undefined) => void;
  onManualCourseChange?: (data: ManualCourseData | undefined) => void;
  manualCourse?: ManualCourseData;
  disabled?: boolean;
}

const inputClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const selectClassName = inputClassName;

type ViewMode = 'search' | 'manual' | 'create';

export function CourseSelector({
  value,
  onChange,
  onManualCourseChange,
  manualCourse,
  disabled = false,
}: CourseSelectorProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [teeSets, setTeeSets] = useState<TeeSet[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(manualCourse ? 'manual' : 'search');
  const [showDropdown, setShowDropdown] = useState(false);
  const [manualData, setManualData] = useState<ManualCourseData>(
    manualCourse || { courseName: '', slopeRating: 113, par: 72 }
  );

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial courses on mount
  useEffect(() => {
    async function loadCourses() {
      setLoading(true);
      setError(null);
      try {
        const data = await getCourses();
        setCourses(data);
        setSearchResults(data);
      } catch (err) {
        setError('Failed to load courses');
        console.error('[CourseSelector] Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, []);

  // Reverse-lookup course when teeSetId (value) is provided on mount
  useEffect(() => {
    async function loadInitialSelection() {
      if (!value) return;

      try {
        // Get the tee set to find its courseId
        const teeSet = await getTeeSetWithHoles(value);
        if (!teeSet) return;

        // Get the course info
        const course = await getCourse(teeSet.courseId);
        if (!course) return;

        // Set the course selection
        setSelectedCourseId(course.id);
        setSearchQuery(course.name);

        // Load tee sets for this course
        const courseTees = await getCourseTeeSets(course.id);
        setTeeSets(courseTees);
      } catch (err) {
        console.error('[CourseSelector] Failed to load initial selection:', err);
      }
    }

    loadInitialSelection();
  }, [value]);

  // Handle search with debounce
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(courses);
      return;
    }

    setSearching(true);
    try {
      const results = await searchCourses(query);
      setSearchResults(results);
    } catch (err) {
      console.error('[CourseSelector] Search failed:', err);
      // Fall back to local filtering
      const lowerQuery = query.toLowerCase();
      setSearchResults(
        courses.filter(
          (c) =>
            c.name.toLowerCase().includes(lowerQuery) ||
            c.city.toLowerCase().includes(lowerQuery) ||
            c.state.toLowerCase().includes(lowerQuery)
        )
      );
    } finally {
      setSearching(false);
    }
  }, [courses]);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, handleSearch]);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCourseSelect = (course: Course) => {
    setSelectedCourseId(course.id);
    setSearchQuery(course.name);
    setShowDropdown(false);
    onChange(undefined); // Clear tee set selection
    onManualCourseChange?.(undefined);
  };

  const handleTeeSetChange = (teeSetId: string) => {
    onChange(teeSetId || undefined);
  };

  const switchToMode = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'manual') {
      setSelectedCourseId('');
      onChange(undefined);
      onManualCourseChange?.(manualData);
    } else if (mode === 'search') {
      onManualCourseChange?.(undefined);
    }
  };

  const handleManualDataChange = (field: keyof ManualCourseData, value: string | number | undefined) => {
    const updated = { ...manualData, [field]: value };
    setManualData(updated);
    onManualCourseChange?.(updated);
  };

  const handleCourseCreated = (course: Course, newTeeSets: TeeSet[]) => {
    // Add new course to the list
    setCourses((prev) => [course, ...prev]);
    setSearchResults((prev) => [course, ...prev]);

    // Select the new course
    setSelectedCourseId(course.id);
    setSearchQuery(course.name);
    setTeeSets(newTeeSets);

    // Switch back to search view
    setViewMode('search');

    // Auto-select first tee set if available
    if (newTeeSets.length > 0) {
      onChange(newTeeSets[0].id);
    }
  };

  // Create new course view
  if (viewMode === 'create') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Add New Course</h3>
          <button
            type="button"
            onClick={() => switchToMode('search')}
            className="text-sm text-primary hover:underline"
          >
            Back to search
          </button>
        </div>
        <CourseEntryForm
          onSuccess={handleCourseCreated}
          onCancel={() => switchToMode('search')}
          disabled={disabled}
        />
      </div>
    );
  }

  // Manual input form
  if (viewMode === 'manual') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Manual Course Entry</h3>
          <button
            type="button"
            onClick={() => switchToMode('search')}
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

        <div className="grid grid-cols-3 gap-4">
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
            <p className="mt-1 text-xs text-muted-foreground">55-155</p>
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
              placeholder="72.5"
              className={`${inputClassName} mt-1`}
              disabled={disabled}
            />
          </div>

          <div>
            <label htmlFor="manual-par" className="block text-sm font-medium text-foreground">
              Par
            </label>
            <input
              id="manual-par"
              type="number"
              min={60}
              max={80}
              value={manualData.par || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                handleManualDataChange('par', isNaN(val) ? undefined : val);
              }}
              placeholder="72"
              className={`${inputClassName} mt-1`}
              disabled={disabled}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => switchToMode('create')}
          className="text-sm text-muted-foreground hover:text-primary hover:underline"
        >
          Want to save this course to the database?
        </button>
      </div>
    );
  }

  // Search view (default)
  return (
    <div className="space-y-3">
      {/* Course Search */}
      <div className="relative" ref={dropdownRef}>
        <label htmlFor="course-search" className="block text-sm font-medium text-foreground">
          Course
        </label>
        <div className="relative mt-1">
          <input
            ref={searchInputRef}
            id="course-search"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
              if (!e.target.value) {
                setSelectedCourseId('');
                onChange(undefined);
              }
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search for a course..."
            className={inputClassName}
            disabled={disabled || loading}
            autoComplete="off"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && !disabled && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg max-h-60 overflow-y-auto">
            {searchResults.length > 0 ? (
              <>
                {searchResults.map((course) => (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => handleCourseSelect(course)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between"
                  >
                    <span>
                      <span className="font-medium">{course.name}</span>
                      {course.city && course.state && (
                        <span className="text-muted-foreground ml-2">
                          {course.city}, {course.state}
                        </span>
                      )}
                    </span>
                    {course.verified && (
                      <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                        Verified
                      </span>
                    )}
                  </button>
                ))}
                <div className="border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      switchToMode('create');
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-primary hover:bg-muted"
                  >
                    + Add new course
                  </button>
                </div>
              </>
            ) : searchQuery ? (
              <div className="p-3">
                <p className="text-sm text-muted-foreground">No courses found</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowDropdown(false);
                    switchToMode('create');
                  }}
                  className="mt-2 text-sm text-primary hover:underline"
                >
                  + Add &quot;{searchQuery}&quot; as new course
                </button>
              </div>
            ) : (
              <div className="p-3 text-sm text-muted-foreground">
                Type to search courses...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tee Set Selection */}
      {selectedCourseId && (
        <div>
          <label htmlFor="tee-set-select" className="block text-sm font-medium text-foreground">
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
                {teeSet.name} ({teeSet.rating}/{teeSet.slope}
                {teeSet.par ? `, Par ${teeSet.par}` : ''})
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

      {/* Error state */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Manual entry option */}
      <button
        type="button"
        onClick={() => switchToMode('manual')}
        className="text-sm text-muted-foreground hover:text-primary hover:underline"
      >
        or enter course details manually
      </button>
    </div>
  );
}
