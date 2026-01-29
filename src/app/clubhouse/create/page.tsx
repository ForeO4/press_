import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CreateClubhouseForm } from '@/components/clubhouse/CreateClubhouseForm';
import { isMockMode } from '@/lib/env/public';

export default async function CreateClubhousePage() {
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

  return <CreateClubhouseForm />;
}
