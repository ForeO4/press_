'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClubhouse } from '@/lib/services/clubhouses';
import type { ClubhouseType } from '@/types';
import { ArrowLeft, Check } from 'lucide-react';

const CLUBHOUSE_TYPES: { value: ClubhouseType; label: string; description: string; icon: string }[] = [
  { value: 'trip', label: 'Golf Trip', description: 'Multi-day golf getaway', icon: '🏌️' },
  { value: 'league', label: 'League', description: 'Recurring weekly/monthly games', icon: '🏆' },
  { value: 'event', label: 'Event', description: 'One-time tournament or outing', icon: '📅' },
  { value: 'social', label: 'Social', description: 'Casual group of golf friends', icon: '👥' },
];

export function CreateClubhouseForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ClubhouseType>('trip');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter a clubhouse name');
      return;
    }

    setLoading(true);

    try {
      const clubhouse = await createClubhouse({
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        privacy: 'private',
      });

      // Redirect to invite page
      router.push(`/clubhouse/${clubhouse.id}/invite`);
    } catch (err) {
      console.error('Failed to create clubhouse:', err);
      setError(err instanceof Error ? err.message : 'Failed to create clubhouse');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/clubhouse/select">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">Create Clubhouse</h1>
      </div>

      <Card className="max-w-md mx-auto w-full">
        <CardHeader>
          <CardTitle>New Clubhouse</CardTitle>
          <CardDescription>
            Create a space for your golf group to track games and stay connected
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Clubhouse Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Clubhouse Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Bandon Dunes 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                id="description"
                type="text"
                placeholder="What's this clubhouse about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Clubhouse Type */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {CLUBHOUSE_TYPES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    className={`relative p-3 rounded-lg border text-left transition-colors ${
                      type === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {type === option.value && (
                      <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    <span className="text-2xl mb-1 block">{option.icon}</span>
                    <span className="font-medium text-sm block">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Clubhouse'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
