'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getClubhouse, regenerateInviteCode } from '@/lib/services/clubhouses';
import type { Clubhouse } from '@/types';
import { ArrowLeft, Copy, Check, RefreshCw, Share2, MessageSquare, Mail } from 'lucide-react';

interface InviteMembersProps {
  clubhouseId: string;
}

export function InviteMembers({ clubhouseId }: InviteMembersProps) {
  const router = useRouter();
  const [clubhouse, setClubhouse] = useState<Clubhouse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadClubhouse() {
      try {
        const data = await getClubhouse(clubhouseId);
        setClubhouse(data);
      } catch (err) {
        console.error('Failed to load clubhouse:', err);
        setError('Failed to load clubhouse');
      } finally {
        setLoading(false);
      }
    }

    loadClubhouse();
  }, [clubhouseId]);

  const handleCopyCode = async () => {
    if (!clubhouse) return;

    try {
      await navigator.clipboard.writeText(clubhouse.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyLink = async () => {
    if (!clubhouse) return;

    const link = `${window.location.origin}/join?code=${clubhouse.inviteCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRegenerateCode = async () => {
    if (!clubhouse) return;

    setRegenerating(true);
    try {
      const newCode = await regenerateInviteCode(clubhouse.id);
      setClubhouse({ ...clubhouse, inviteCode: newCode });
    } catch (err) {
      console.error('Failed to regenerate code:', err);
      setError('Failed to regenerate invite code');
    } finally {
      setRegenerating(false);
    }
  };

  const handleShare = async () => {
    if (!clubhouse) return;

    const shareData = {
      title: `Join ${clubhouse.name} on Press!`,
      text: `Join my golf clubhouse "${clubhouse.name}" on Press! Use invite code: ${clubhouse.inviteCode}`,
      url: `${window.location.origin}/join?code=${clubhouse.inviteCode}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleContinue = () => {
    router.push(`/app?clubhouse=${clubhouseId}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !clubhouse) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">{error || 'Clubhouse not found'}</p>
            <Link href="/clubhouse/select">
              <Button variant="link">Go back</Button>
            </Link>
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
        <h1 className="text-xl font-bold text-foreground">Invite Members</h1>
      </div>

      <Card className="max-w-md mx-auto w-full">
        <CardHeader className="text-center">
          <CardTitle>{clubhouse.name}</CardTitle>
          <CardDescription>
            Share the invite code with your golf buddies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invite Code Display */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Invite Code</p>
            <div className="flex items-center justify-center gap-2">
              <div className="flex gap-1">
                {clubhouse.inviteCode.split('').map((char, i) => (
                  <div
                    key={i}
                    className="w-10 h-12 flex items-center justify-center bg-muted rounded-lg text-xl font-mono font-bold"
                  >
                    {char}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Copy Code Button */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleCopyCode}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Code
              </>
            )}
          </Button>

          {/* Share Options */}
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open(`sms:?body=Join my golf clubhouse on Press! Use code: ${clubhouse.inviteCode} or visit ${window.location.origin}/join?code=${clubhouse.inviteCode}`, '_blank');
              }}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open(`mailto:?subject=Join ${clubhouse.name} on Press!&body=Join my golf clubhouse on Press! Use code: ${clubhouse.inviteCode} or visit ${window.location.origin}/join?code=${clubhouse.inviteCode}`, '_blank');
              }}
            >
              <Mail className="h-4 w-4" />
            </Button>
          </div>

          {/* Regenerate Code */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2 text-muted-foreground"
            onClick={handleRegenerateCode}
            disabled={regenerating}
          >
            <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
            Generate New Code
          </Button>

          {/* Continue Button */}
          <div className="pt-4">
            <Button className="w-full" onClick={handleContinue}>
              Continue to Clubhouse
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
