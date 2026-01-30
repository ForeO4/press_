'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlayerCountInput } from './PlayerCountInput';
import { EventVisibility } from '@/types';
import { cn } from '@/lib/utils';

export interface DetailsFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  expectedPlayers: number;
  visibility: EventVisibility;
}

interface StepDetailsProps {
  data: DetailsFormData;
  onChange: (data: DetailsFormData) => void;
  onNext: () => void;
  onBack: () => void;
  showEndDate: boolean; // Show end date for tournaments or multi-round events
}

const VISIBILITY_OPTIONS = [
  {
    value: 'PRIVATE' as const,
    label: 'Private',
    description: 'Only invited players can join',
  },
  {
    value: 'UNLISTED' as const,
    label: 'Unlisted',
    description: 'Anyone with the link can join',
  },
  {
    value: 'PUBLIC' as const,
    label: 'Public',
    description: 'Anyone can discover and join',
  },
];

interface Errors {
  name?: string;
  startDate?: string;
  endDate?: string;
}

export function StepDetails({
  data,
  onChange,
  onNext,
  onBack,
  showEndDate,
}: StepDetailsProps) {
  const [errors, setErrors] = useState<Errors>({});

  const handleChange = <K extends keyof DetailsFormData>(
    field: K,
    value: DetailsFormData[K]
  ) => {
    onChange({ ...data, [field]: value });
    if (errors[field as keyof Errors]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const validate = (): boolean => {
    const newErrors: Errors = {};

    if (!data.name.trim()) {
      newErrors.name = 'Event name is required';
    }

    if (!data.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (showEndDate && data.endDate && data.startDate > data.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">Event Details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up your event identity and schedule
        </p>
      </div>

      {/* Event Name */}
      <div>
        <label
          htmlFor="event-name"
          className="block text-sm font-medium text-foreground"
        >
          Event Name
        </label>
        <Input
          id="event-name"
          type="text"
          value={data.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., Saturday Skins Game"
          className={cn('mt-1', errors.name && 'border-destructive')}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="event-description"
          className="block text-sm font-medium text-foreground"
        >
          Description
          <span className="ml-1 text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="event-description"
          value={data.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Tell players what to expect..."
          rows={3}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Dates */}
      <div className={cn('grid gap-4', showEndDate ? 'sm:grid-cols-2' : '')}>
        <div>
          <label
            htmlFor="start-date"
            className="block text-sm font-medium text-foreground"
          >
            Start Date
          </label>
          <Input
            id="start-date"
            type="date"
            value={data.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
            className={cn('mt-1', errors.startDate && 'border-destructive')}
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-destructive">{errors.startDate}</p>
          )}
        </div>
        {showEndDate && (
          <div>
            <label
              htmlFor="end-date"
              className="block text-sm font-medium text-foreground"
            >
              End Date
              <span className="ml-1 text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="end-date"
              type="date"
              value={data.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              min={data.startDate || undefined}
              className={cn('mt-1', errors.endDate && 'border-destructive')}
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-destructive">{errors.endDate}</p>
            )}
          </div>
        )}
      </div>

      {/* Expected Players */}
      <div>
        <label className="block text-sm font-medium text-foreground">
          Expected Players
        </label>
        <p className="mt-0.5 text-sm text-muted-foreground">
          How many players do you expect?
        </p>
        <div className="mt-2">
          <PlayerCountInput
            value={data.expectedPlayers}
            onChange={(count) => handleChange('expectedPlayers', count)}
          />
        </div>
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm font-medium text-foreground">
          Visibility
        </label>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {VISIBILITY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer flex-col rounded-lg border p-3 transition-colors',
                data.visibility === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-input hover:bg-accent'
              )}
            >
              <input
                type="radio"
                name="visibility"
                value={option.value}
                checked={data.visibility === option.value}
                onChange={() => handleChange('visibility', option.value)}
                className="sr-only"
              />
              <span className="font-medium text-foreground">{option.label}</span>
              <span className="text-xs text-muted-foreground">
                {option.description}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </div>
  );
}
