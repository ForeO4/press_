'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getShareLinkByToken, joinEventViaLink, isLinkValid } from '@/lib/services/invites';
import { getEvent } from '@/lib/services/events';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/lib/auth/AuthProvider';
import type { ShareLink } from '@/lib/services/invites';
import type { Event } from '@/types';

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const user = useCurrentUser();
  const { loading: authLoading } = useAuth();

  const [link, setLink] = useState<ShareLink | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadInvite() {
      if (!token) {
        setError('Invalid invite link');
        setIsLoading(false);
        return;
      }

      try {
        const shareLink = await getShareLinkByToken(token);
        if (!shareLink) {
          setError('This invite link is invalid or has been deleted');
          setIsLoading(false);
          return;
        }

        if (!isLinkValid(shareLink)) {
          setError('This invite link has expired');
          setIsLoading(false);
          return;
        }

        setLink(shareLink);

        // Load event details
        const eventData = await getEvent(shareLink.eventId);
        setEvent(eventData);
      } catch (err) {
        setError('Failed to load invite');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadInvite();
  }, [token]);

  const handleJoin = async () => {
    if (!link || !user?.id) return;

    setIsJoining(true);
    setError(null);

    try {
      await joinEventViaLink(link, user.id);
      setSuccess(true);
      // Redirect to event after short delay
      setTimeout(() => {
        router.push(`/event/${link.eventId}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join event');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading invite...</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">
              Invalid Invite
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Link href="/app">
              <Button variant="outline">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center space-y-4">
            <div className="h-16 w-16 bg-success/20 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="h-8 w-8 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              You're in!
            </h2>
            <p className="text-muted-foreground">
              Redirecting to {event?.name ?? 'the event'}...
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Not logged in - prompt to sign in
  if (!user) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              You're Invited!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {event && (
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-lg font-semibold text-foreground">
                  {event.name}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(event.date).toLocaleDateString()}
                </p>
              </div>
            )}

            <p className="text-center text-muted-foreground">
              Sign in or create an account to join this event.
            </p>

            <div className="space-y-2">
              <Link href={`/auth/login?redirect=/invite/${token}`}>
                <Button className="w-full">Sign In</Button>
              </Link>
              <Link href={`/auth/signup?redirect=/invite/${token}`}>
                <Button variant="outline" className="w-full">
                  Create Account
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Logged in - show join confirmation
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            Join Event
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {event && (
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-lg font-semibold text-foreground">
                {event.name}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(event.date).toLocaleDateString()}
              </p>
            </div>
          )}

          <p className="text-center text-muted-foreground">
            Hi <strong>{user.name}</strong>, you've been invited to join this event.
          </p>

          <Button onClick={handleJoin} disabled={isJoining} className="w-full">
            {isJoining ? 'Joining...' : 'Join Event'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Not {user.name}?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in with a different account
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
