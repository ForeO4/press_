'use client';

import { useSearchParams } from 'next/navigation';
import { GameTypeSelector } from '@/components/games/wizard/GameTypeSelector';

export default function GameTypePage() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') || undefined;

  return <GameTypeSelector eventId={eventId} />;
}
