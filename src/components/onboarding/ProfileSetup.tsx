'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
import { User, Camera } from 'lucide-react';

interface ProfileSetupProps {
  userId: string;
  email?: string;
}

export function ProfileSetup({ userId, email }: ProfileSetupProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [ghinNumber, setGhinNumber] = useState('');
  const [handicapIndex, setHandicapIndex] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!displayName.trim()) {
      setError('Please enter your display name');
      setLoading(false);
      return;
    }

    if (isMockMode) {
      // In mock mode, just redirect
      router.push('/clubhouse/select');
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError('Database not available');
      setLoading(false);
      return;
    }

    try {
      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          display_name: displayName.trim(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      // Update handicap profile if provided
      if (handicapIndex || ghinNumber) {
        const { error: handicapError } = await supabase
          .from('handicap_profiles')
          .upsert({
            user_id: userId,
            handicap_index: handicapIndex ? parseFloat(handicapIndex) : null,
            ghin_number: ghinNumber || null,
            updated_at: new Date().toISOString(),
          });

        if (handicapError) {
          console.error('Handicap profile error:', handicapError);
          // Don't fail the whole flow for handicap
        }
      }

      router.push('/clubhouse/select');
      router.refresh();
    } catch (err) {
      console.error('Profile setup error:', err);
      setError('Failed to save profile. Please try again.');
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/clubhouse/select');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-muted flex items-center justify-center relative">
            <User className="h-10 w-10 text-muted-foreground" />
            <button
              type="button"
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <CardTitle>Set Up Your Profile</CardTitle>
          <CardDescription>
            Tell us a bit about yourself to get started
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Display Name */}
            <div className="space-y-2">
              <label htmlFor="displayName" className="text-sm font-medium">
                Display Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="displayName"
                type="text"
                placeholder="How should we call you?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* GHIN Number */}
            <div className="space-y-2">
              <label htmlFor="ghinNumber" className="text-sm font-medium">
                GHIN Number <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                id="ghinNumber"
                type="text"
                placeholder="e.g., 1234567"
                value={ghinNumber}
                onChange={(e) => setGhinNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                We can sync your handicap automatically
              </p>
            </div>

            {/* Handicap Index */}
            <div className="space-y-2">
              <label htmlFor="handicapIndex" className="text-sm font-medium">
                Handicap Index <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                id="handicapIndex"
                type="number"
                step="0.1"
                min="-10"
                max="54"
                placeholder="e.g., 12.4"
                value={handicapIndex}
                onChange={(e) => setHandicapIndex(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-col gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Continue'}
              </Button>
              <Button type="button" variant="ghost" onClick={handleSkip}>
                Skip for now
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
