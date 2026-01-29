import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { GameResults } from '@/components/games/GameResults';
import { isMockMode } from '@/lib/env/public';

interface Props {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ eventId?: string }>;
}

export default async function GameResultsPage({ params, searchParams }: Props) {
  const { gameId } = await params;
  const { eventId } = await searchParams;

  if (!eventId) {
    redirect('/app');
  }

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

  return <GameResults gameId={gameId} eventId={eventId} />;
}
