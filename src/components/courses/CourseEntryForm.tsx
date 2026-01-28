'use client';

import { useState } from 'react';
import { createCourseWithTeeSets } from '@/lib/services/courses';
import type { Course, TeeSet, CreateCourseInput, CreateTeeSetInput } from '@/types';

interface TeeSetFormData {
  id: string; // Temporary ID for form management
  name: string;
  color: string;
  rating: string;
  slope: string;
  par: string;
  yardage: string;
}

interface CourseEntryFormProps {
  onSuccess: (course: Course, teeSets: TeeSet[]) => void;
  onCancel: () => void;
  disabled?: boolean;
}

const TEE_COLOR_OPTIONS = [
  { value: 'Black', label: 'Black', bg: 'bg-gray-800' },
  { value: 'Blue', label: 'Blue', bg: 'bg-blue-600' },
  { value: 'White', label: 'White', bg: 'bg-white border border-gray-300' },
  { value: 'Gold', label: 'Gold', bg: 'bg-yellow-500' },
  { value: 'Red', label: 'Red', bg: 'bg-red-600' },
  { value: 'Green', label: 'Green', bg: 'bg-green-600' },
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const inputClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const selectClassName = inputClassName;

function createEmptyTeeSet(): TeeSetFormData {
  return {
    id: crypto.randomUUID(),
    name: '',
    color: 'White',
    rating: '',
    slope: '113',
    par: '72',
    yardage: '',
  };
}

export function CourseEntryForm({ onSuccess, onCancel, disabled = false }: CourseEntryFormProps) {
  const [courseName, setCourseName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [teeSets, setTeeSets] = useState<TeeSetFormData[]>([createEmptyTeeSet()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTeeSet = () => {
    setTeeSets([...teeSets, createEmptyTeeSet()]);
  };

  const handleRemoveTeeSet = (id: string) => {
    if (teeSets.length > 1) {
      setTeeSets(teeSets.filter((ts) => ts.id !== id));
    }
  };

  const handleTeeSetChange = (id: string, field: keyof TeeSetFormData, value: string) => {
    setTeeSets(
      teeSets.map((ts) => (ts.id === id ? { ...ts, [field]: value } : ts))
    );
  };

  const validateForm = (): string | null => {
    if (!courseName.trim()) {
      return 'Course name is required';
    }

    for (const teeSet of teeSets) {
      if (!teeSet.name.trim()) {
        return 'All tee sets must have a name';
      }

      const rating = parseFloat(teeSet.rating);
      if (isNaN(rating) || rating < 60 || rating > 80) {
        return `Course rating for ${teeSet.name} must be between 60 and 80`;
      }

      const slope = parseInt(teeSet.slope);
      if (isNaN(slope) || slope < 55 || slope > 155) {
        return `Slope rating for ${teeSet.name} must be between 55 and 155`;
      }

      const par = parseInt(teeSet.par);
      if (isNaN(par) || par < 60 || par > 80) {
        return `Par for ${teeSet.name} must be between 60 and 80`;
      }

      if (teeSet.yardage) {
        const yardage = parseInt(teeSet.yardage);
        if (isNaN(yardage) || yardage < 3000 || yardage > 9000) {
          return `Yardage for ${teeSet.name} must be between 3000 and 9000`;
        }
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const courseInput: CreateCourseInput = {
        name: courseName.trim(),
        city: city.trim() || undefined,
        state: state || undefined,
      };

      const teeSetInputs: Omit<CreateTeeSetInput, 'courseId'>[] = teeSets.map((ts) => ({
        name: ts.name.trim(),
        color: ts.color,
        rating: parseFloat(ts.rating),
        slope: parseInt(ts.slope),
        par: parseInt(ts.par),
        yardage: ts.yardage ? parseInt(ts.yardage) : undefined,
      }));

      const result = await createCourseWithTeeSets(courseInput, teeSetInputs);
      onSuccess(result.course, result.teeSets);
    } catch (err) {
      console.error('[CourseEntryForm] Failed to create course:', err);
      setError('Failed to create course. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Course Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Course Information</h3>

        <div>
          <label htmlFor="course-name" className="block text-sm font-medium text-foreground">
            Course Name *
          </label>
          <input
            id="course-name"
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="e.g., Pine Valley Golf Club"
            className={`${inputClassName} mt-1`}
            disabled={disabled || saving}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="course-city" className="block text-sm font-medium text-foreground">
              City
            </label>
            <input
              id="course-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Pine Valley"
              className={`${inputClassName} mt-1`}
              disabled={disabled || saving}
            />
          </div>

          <div>
            <label htmlFor="course-state" className="block text-sm font-medium text-foreground">
              State
            </label>
            <select
              id="course-state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className={`${selectClassName} mt-1`}
              disabled={disabled || saving}
            >
              <option value="">Select state...</option>
              {US_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tee Sets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Tee Sets</h3>
          <button
            type="button"
            onClick={handleAddTeeSet}
            disabled={disabled || saving}
            className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
          >
            + Add Tee Set
          </button>
        </div>

        {teeSets.map((teeSet, index) => (
          <div
            key={teeSet.id}
            className="rounded-lg border border-border bg-card p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">
                Tee Set {index + 1}
              </h4>
              {teeSets.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveTeeSet(teeSet.id)}
                  disabled={disabled || saving}
                  className="text-sm text-destructive hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Name *
                </label>
                <input
                  type="text"
                  value={teeSet.name}
                  onChange={(e) => handleTeeSetChange(teeSet.id, 'name', e.target.value)}
                  placeholder="e.g., Championship"
                  className={`${inputClassName} mt-1`}
                  disabled={disabled || saving}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  Color
                </label>
                <select
                  value={teeSet.color}
                  onChange={(e) => handleTeeSetChange(teeSet.id, 'color', e.target.value)}
                  className={`${selectClassName} mt-1`}
                  disabled={disabled || saving}
                >
                  {TEE_COLOR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Rating *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="60"
                  max="80"
                  value={teeSet.rating}
                  onChange={(e) => handleTeeSetChange(teeSet.id, 'rating', e.target.value)}
                  placeholder="72.5"
                  className={`${inputClassName} mt-1`}
                  disabled={disabled || saving}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  Slope *
                </label>
                <input
                  type="number"
                  min="55"
                  max="155"
                  value={teeSet.slope}
                  onChange={(e) => handleTeeSetChange(teeSet.id, 'slope', e.target.value)}
                  placeholder="113"
                  className={`${inputClassName} mt-1`}
                  disabled={disabled || saving}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  Par *
                </label>
                <input
                  type="number"
                  min="60"
                  max="80"
                  value={teeSet.par}
                  onChange={(e) => handleTeeSetChange(teeSet.id, 'par', e.target.value)}
                  placeholder="72"
                  className={`${inputClassName} mt-1`}
                  disabled={disabled || saving}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  Yardage
                </label>
                <input
                  type="number"
                  min="3000"
                  max="9000"
                  value={teeSet.yardage}
                  onChange={(e) => handleTeeSetChange(teeSet.id, 'yardage', e.target.value)}
                  placeholder="6500"
                  className={`${inputClassName} mt-1`}
                  disabled={disabled || saving}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-md hover:bg-muted disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={disabled || saving}
          className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Creating...' : 'Create Course'}
        </button>
      </div>
    </form>
  );
}
