import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { isMockMode } from '@/lib/env/public';

export default async function ForgotPasswordPage() {
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <ForgotPasswordForm />
    </main>
  );
}
