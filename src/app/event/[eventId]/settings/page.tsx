'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EventForm } from '@/components/events/EventForm';
import { getEvent, updateEvent, deleteEvent } from '@/lib/services/events';
import type { Event, CreateEventInput } from '@/types';

export default function EventSettingsPage({
  params,
}: {
  params: { eventId: string };
}) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const eventData = await getEvent(params.eventId);
        setEvent(eventData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvent();
  }, [params.eventId]);

  const handleUpdate = async (values: CreateEventInput) => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updated = await updateEvent(params.eventId, values);
      setEvent(updated);
      setSuccessMessage('Event updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await deleteEvent(params.eventId);
      router.push('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading event settings...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">Event not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Event Settings</h1>
        <p className="text-muted-foreground">
          Manage your event configuration
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-md bg-success/10 p-3 text-sm text-success">
          {successMessage}
        </div>
      )}

      {/* Edit Event */}
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm
            initialValues={{
              name: event.name,
              date: event.date,
              visibility: event.visibility,
            }}
            onSubmit={handleUpdate}
            submitLabel="Save Changes"
            isLoading={isSaving}
          />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Delete Event</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this event and all associated data
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Event
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-foreground">
                Are you sure you want to delete &quot;{event.name}&quot;? This
                action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Event'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
