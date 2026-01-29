'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { joinClubhouseByCode, getClubhouseByInviteCode } from '@/lib/services/clubhouses';
import type { Clubhouse } from '@/types';
import { ArrowLeft, Users, CheckCircle } from 'lucide-react';

export function JoinClubhouse() {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewClubhouse, setPreviewClubhouse] = useState<Clubhouse | null>(null);
  const [joined, setJoined] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Preview clubhouse when code is complete
  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      handlePreview(fullCode);
    } else {
      setPreviewClubhouse(null);
      setError(null);
    }
  }, [code]);

  const handlePreview = async (inviteCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const clubhouse = await getClubhouseByInviteCode(inviteCode);
      setPreviewClubhouse(clubhouse);
      if (!clubhouse) {
        setError('Invalid invite code');
      }
    } catch (err) {
      console.error('Preview error:', err);
      setError('Invalid invite code');
      setPreviewClubhouse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    // Only allow alphanumeric
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (cleaned.length > 1) {
      // Pasted value - distribute across inputs
      const chars = cleaned.slice(0, 6 - index).split('');
      const newCode = [...code];
      chars.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
        }
      });
      setCode(newCode);
      // Focus appropriate input
      const nextIndex = Math.min(index + chars.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      // Single character
      const newCode = [...code];
      newCode[index] = cleaned;
      setCode(newCode);

      if (cleaned && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleJoin = async () => {
    const inviteCode = code.join('');
    if (inviteCode.length !== 6) {
      setError('Please enter a 6-character code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const clubhouse = await joinClubhouseByCode(inviteCode);
      setJoined(true);

      // Wait briefly then redirect
      setTimeout(() => {
        router.push(`/app?clubhouse=${clubhouse.id}`);
      }, 1500);
    } catch (err) {
      console.error('Join error:', err);
      setError(err instanceof Error ? err.message : 'Failed to join clubhouse');
      setLoading(false);
    }
  };

  if (joined && previewClubhouse) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-green-500/10 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Welcome!
            </h2>
            <p className="text-muted-foreground">
              You've joined {previewClubhouse.name}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/clubhouse/select">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">Join Clubhouse</h1>
      </div>

      <Card className="max-w-md mx-auto w-full">
        <CardHeader className="text-center">
          <CardTitle>Enter Invite Code</CardTitle>
          <CardDescription>
            Ask your group organizer for the 6-character code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Code Input */}
          <div className="flex justify-center gap-2">
            {code.map((char, index) => (
              <Input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="text"
                maxLength={6}
                value={char}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-xl font-mono uppercase"
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Preview */}
          {previewClubhouse && (
            <div className="p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">
                    {previewClubhouse.name}
                  </h3>
                  {previewClubhouse.description && (
                    <p className="text-sm text-muted-foreground">
                      {previewClubhouse.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button
            onClick={handleJoin}
            className="w-full"
            disabled={loading || !previewClubhouse}
          >
            {loading ? 'Joining...' : 'Join Clubhouse'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
