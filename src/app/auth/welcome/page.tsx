import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { WelcomeScreen } from '@/components/auth/WelcomeScreen';
import { isMockMode } from '@/lib/env/public';

export default async function WelcomePage() {
  // Skip auth check in mock mode
  if (!isMockMode) {
    const supabase = createServerSupabaseClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        redirect('/app');
      }
    }
  }

  return <WelcomeScreen />;
}
