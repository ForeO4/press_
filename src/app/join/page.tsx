'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getShareLinkByCode, joinEventViaLink, isLinkValid } from '@/lib/services/invites';
import { getEvent } from '@/lib/services/events';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/lib/auth/AuthProvider';
import type { Event } from '@/types';

export default function JoinPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const { loading: authLoading } = useAuth();

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCodeChange = (value: string) => {
    // Convert to uppercase and remove non-alphanumeric
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(cleaned);
    setError(null);
    setEvent(null);
  };

  const handleLookup = async () => {
    if (code.length !== 6) {
      setError('Please enter a 6-character code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const link = await getShareLinkByCode(code);
      if (!link) {
        setError('Invalid code. Please check and try again.');
        setIsLoading(false);
        return;
      }

      if (!isLinkValid(link)) {
        setError('This invite code has expired');
        setIsLoading(false);
        return;
      }

      setLinkToken(link.token);

      // Load event details
      const eventData = await getEvent(link.eventId);
      setEvent(eventData);
    } catch (err) {
      setError('Failed to look up code');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!linkToken || !user?.id) return;

    setIsJoining(true);
    setError(null);

    try {
      const link = await getShareLinkByCode(code);
      if (!link) {
        setError('Code is no longer valid');
        return;
      }

      await joinEventViaLink(link, user.id);
      setSuccess(true);
      // Redirect to event
      setTimeout(() => {
        router.push(`/event/${link.eventId}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join event');
    } finally {
      setIsJoining(false);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
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

  // Not logged in
  if (!user) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Join an Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              Sign in or create an account to join an event.
            </p>

            <div className="space-y-2">
              <Link href={`/auth/login?redirect=/join`}>
                <Button className="w-full">Sign In</Button>
              </Link>
              <Link href={`/auth/signup?redirect=/join`}>
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

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Join an Event</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!event ? (
            // Code entry
            <>
              <p className="text-center text-muted-foreground">
                Enter the 6-character event code to join.
              </p>

              <div className="space-y-4">
                <div>
                  <Input
                    type="text"
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="ABCD12"
                    className="text-center text-2xl font-mono tracking-widest h-14"
                    maxLength={6}
                  />
                  {error && (
                    <p className="mt-2 text-sm text-destructive text-center">
                      {error}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleLookup}
                  disabled={code.length !== 6 || isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Looking up...' : 'Find Event'}
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Have an invite link?{' '}
                <span className="text-foreground">
                  Just click it to join directly.
                </span>
              </p>
            </>
          ) : (
            // Event found - confirm join
            <>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-lg font-semibold text-foreground">
                  {event.name}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(event.date).toLocaleDateString()}
                </p>
              </div>

              <p className="text-center text-muted-foreground">
                Hi <strong>{user.name}</strong>, would you like to join this event?
              </p>

              <div className="space-y-2">
                <Button
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="w-full"
                >
                  {isJoining ? 'Joining...' : 'Join Event'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEvent(null);
                    setCode('');
                    setLinkToken(null);
                  }}
                  className="w-full"
                >
                  Try a Different Code
                </Button>
              </div>
            </>
          )}

          <div className="pt-4 border-t text-center">
            <Link
              href="/app"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back to Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
