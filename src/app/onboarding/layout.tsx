import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isMockMode } from '@/lib/env/public';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In mock mode, allow access
  if (!isMockMode) {
    const supabase = createServerSupabaseClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Must be logged in for onboarding
      if (!user) {
        redirect('/auth/welcome');
      }
    }
  }

  return <>{children}</>;
}
