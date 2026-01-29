import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { JoinClubhouse } from '@/components/clubhouse/JoinClubhouse';
import { isMockMode } from '@/lib/env/public';

export default async function JoinClubhousePage() {
  if (!isMockMode) {
    const supabase = createServerSupabaseClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        redirect('/auth/welcome');
      }
    }
  }

  return <JoinClubhouse />;
}
