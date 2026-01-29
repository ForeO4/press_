import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ClubhouseSelector } from '@/components/clubhouse/ClubhouseSelector';
import { isMockMode } from '@/lib/env/public';

export default async function ClubhouseSelectPage() {
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

  return <ClubhouseSelector />;
}
