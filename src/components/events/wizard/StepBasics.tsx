'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { EventVisibility } from '@/types';

export interface BasicFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  visibility: EventVisibility;
}

interface StepBasicsProps {
  data: BasicFormData;
  onChange: (data: BasicFormData) => void;
  onNext: () => void;
  onCancel: () => void;
}

export function StepBasics({ data, onChange, onNext, onCancel }: StepBasicsProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof BasicFormData, string>>>({});

  const validate = () => {
    const newErrors: Partial<Record<keyof BasicFormData, string>> = {};

    if (!data.name.trim()) {
      newErrors.name = 'Clubhouse name is required';
    }

    if (!data.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (data.endDate && data.endDate < data.startDate) {
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

  const handleChange = <K extends keyof BasicFormData>(
    field: K,
    value: BasicFormData[K]
  ) => {
    onChange({ ...data, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Clubhouse Basics</h2>
        <p className="text-sm text-muted-foreground">
          Set up your golf clubhouse with a name and dates.
        </p>
      </div>

      <div className="space-y-4">
        {/* Clubhouse Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-foreground"
          >
            Clubhouse Name *
          </label>
          <Input
            id="name"
            type="text"
            value={data.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., Saturday Nassau Group"
            className={`mt-1 ${errors.name ? 'border-destructive' : ''}`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-foreground"
          >
            Description (optional)
          </label>
          <textarea
            id="description"
            value={data.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Add any details about your clubhouse..."
            rows={3}
            className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-foreground"
            >
              Start Date *
            </label>
            <Input
              id="startDate"
              type="date"
              value={data.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className={`mt-1 ${errors.startDate ? 'border-destructive' : ''}`}
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-destructive">{errors.startDate}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-foreground"
            >
              End Date (optional)
            </label>
            <Input
              id="endDate"
              type="date"
              value={data.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              min={data.startDate}
              className={`mt-1 ${errors.endDate ? 'border-destructive' : ''}`}
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-destructive">{errors.endDate}</p>
            )}
          </div>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            Clubhouse Visibility
          </label>
          <div className="mt-2 space-y-2">
            {[
              { value: 'PRIVATE' as const, label: 'Private', desc: 'Only invited members can see' },
              { value: 'UNLISTED' as const, label: 'Unlisted', desc: 'Anyone with the link can view' },
              { value: 'PUBLIC' as const, label: 'Public', desc: 'Visible to everyone' },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
                  data.visibility === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-input hover:bg-accent'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={option.value}
                  checked={data.visibility === option.value}
                  onChange={() => handleChange('visibility', option.value)}
                  className="sr-only"
                />
                <div>
                  <span className="font-medium text-foreground">
                    {option.label}
                  </span>
                  <p className="text-sm text-muted-foreground">{option.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleNext}>
          Continue
        </Button>
      </div>
    </div>
  );
}
