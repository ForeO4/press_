'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EventForm } from './EventForm';
import { createEvent } from '@/lib/services/events';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { CreateEventInput } from '@/types';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateEventModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateEventModalProps) {
  const router = useRouter();
  const user = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (values: CreateEventInput) => {
    if (!user?.id) {
      setError('You must be logged in to create an event');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const event = await createEvent(values, user.id);
      onSuccess?.();
      onClose();
      router.push(`/event/${event.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold text-card-foreground">
          Create New Event
        </h2>

        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <EventForm
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitLabel="Create Event"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
