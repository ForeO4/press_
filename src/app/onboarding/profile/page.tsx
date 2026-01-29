import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ProfileSetup } from '@/components/onboarding/ProfileSetup';
import { isMockMode } from '@/lib/env/public';

export default async function ProfileSetupPage() {
  if (isMockMode) {
    return <ProfileSetup userId="mock-user" email="demo@example.com" />;
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    redirect('/auth/welcome');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/welcome');
  }

  return <ProfileSetup userId={user.id} email={user.email} />;
}
