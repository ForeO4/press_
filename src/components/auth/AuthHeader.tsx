'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/lib/auth/AuthProvider';
import { UserSwitcher } from '@/components/UserSwitcher';
import { Button } from '@/components/ui/button';
import { isMockMode } from '@/lib/env/public';

export function AuthHeader() {
  const router = useRouter();
  const user = useCurrentUser();
  const { signOut, loading } = useAuth();

  // Show UserSwitcher in mock mode
  if (isMockMode) {
    return <UserSwitcher />;
  }

  // Loading state
  if (loading) {
    return <div className="h-9 w-20 animate-pulse rounded bg-muted" />;
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex gap-2">
        <Link href="/auth/login">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </Link>
        <Link href="/auth/signup">
          <Button size="sm">Sign Up</Button>
        </Link>
      </div>
    );
  }

  // Logged in
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground">{user.name}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => {
          await signOut();
          router.push('/');
          router.refresh();
        }}
      >
        Sign Out
      </Button>
    </div>
  );
}
