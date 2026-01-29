'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CourseSelector } from '@/components/courses';
import type { CreateEventInput, EventVisibility } from '@/types';

interface EventFormProps {
  initialValues?: Partial<CreateEventInput>;
  onSubmit: (values: CreateEventInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
  showCourseSelector?: boolean;
}

export function EventForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Create Clubhouse',
  isLoading = false,
  showCourseSelector = true,
}: EventFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [date, setDate] = useState(initialValues?.date ?? '');
  const [visibility, setVisibility] = useState<EventVisibility>(
    initialValues?.visibility ?? 'PRIVATE'
  );
  const [teeSetId, setTeeSetId] = useState<string | undefined>(
    initialValues?.teeSetId
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Clubhouse name is required';
    }

    if (!date) {
      newErrors.date = 'Clubhouse date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await onSubmit({
      name: name.trim(),
      date,
      visibility,
      teeSetId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="event-name"
          className="block text-sm font-medium text-foreground"
        >
          Clubhouse Name
        </label>
        <Input
          id="event-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Spring Classic 2024"
          className="mt-1"
          disabled={isLoading}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="event-date"
          className="block text-sm font-medium text-foreground"
        >
          Date
        </label>
        <Input
          id="event-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1"
          disabled={isLoading}
        />
        {errors.date && (
          <p className="mt-1 text-sm text-destructive">{errors.date}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="event-visibility"
          className="block text-sm font-medium text-foreground"
        >
          Visibility
        </label>
        <select
          id="event-visibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as EventVisibility)}
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading}
        >
          <option value="PRIVATE">Private - Invite only</option>
          <option value="UNLISTED">Unlisted - Anyone with link</option>
          <option value="PUBLIC">Public - Discoverable</option>
        </select>
      </div>

      {showCourseSelector && (
        <CourseSelector
          value={teeSetId}
          onChange={setTeeSetId}
          disabled={isLoading}
        />
      )}

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
