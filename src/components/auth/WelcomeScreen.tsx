'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlligatorIcon } from '@/components/ui/AlligatorIcon';

export function WelcomeScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-6">
      {/* Logo and Brand */}
      <div className="flex flex-col items-center space-y-4 mb-12">
        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
          <AlligatorIcon className="h-14 w-14 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-foreground">Press!</h1>
        <p className="text-center text-muted-foreground max-w-sm">
          Track your golf games, manage bets with friends, and keep the competition fun.
        </p>
      </div>

      {/* Feature highlights */}
      <div className="grid gap-4 mb-12 max-w-sm w-full">
        <FeatureItem
          icon="🏌️"
          title="Track Your Rounds"
          description="Live scoring with real-time leaderboards"
        />
        <FeatureItem
          icon="🤝"
          title="Friendly Wagers"
          description="Nassau, skins, and match play with auto-press"
        />
        <FeatureItem
          icon="🏆"
          title="Clubhouse Groups"
          description="Create trips, leagues, and social groups"
        />
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <Link href="/auth/signup" className="w-full">
          <Button size="lg" className="w-full">
            Get Started
          </Button>
        </Link>
        <Link href="/auth/login" className="w-full">
          <Button size="lg" variant="outline" className="w-full">
            Sign In
          </Button>
        </Link>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-muted-foreground text-center">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-card border">
      <span className="text-2xl">{icon}</span>
      <div>
        <h3 className="font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
