import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isMockMode } from '@/lib/env/public';

export default async function GameWizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return <>{children}</>;
}
