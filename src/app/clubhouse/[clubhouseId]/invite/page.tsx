import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { InviteMembers } from '@/components/clubhouse/InviteMembers';
import { isMockMode } from '@/lib/env/public';

interface Props {
  params: Promise<{ clubhouseId: string }>;
}

export default async function InviteMembersPage({ params }: Props) {
  const { clubhouseId } = await params;

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

  return <InviteMembers clubhouseId={clubhouseId} />;
}
