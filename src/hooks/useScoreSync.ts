'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
import { useScorecardStore } from '@/stores/scorecardStore';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type SyncStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseScoreSyncOptions {
  eventId: string;
}

interface UseScoreSyncResult {
  status: SyncStatus;
  error: string | null;
}

interface HoleScorePayload {
  id: string;
  round_id: string;
  hole_number: number;
  strokes: number;
  created_at: string;
  updated_at: string;
}

/**
 * Hook that subscribes to Supabase Realtime for score changes
 * and updates the scorecard store with remote changes
 */
export function useScoreSync({ eventId }: UseScoreSyncOptions): UseScoreSyncResult {
  const [status, setStatus] = useState<SyncStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const roundToUserMap = useScorecardStore((state) => state.roundToUserMap);
  const handleRemoteScoreChange = useScorecardStore((state) => state.handleRemoteScoreChange);

  // Handle incoming realtime payload
  const handlePayload = useCallback(
    (payload: RealtimePostgresChangesPayload<HoleScorePayload>) => {
      const newData = payload.new as HoleScorePayload | undefined;

      if (!newData) {
        // DELETE event - we don't handle score deletions
        return;
      }

      const { round_id: roundId, hole_number: holeNumber, strokes } = newData;

      // Apply the remote change (store handles echo detection)
      handleRemoteScoreChange(roundId, holeNumber, strokes);
    },
    [handleRemoteScoreChange]
  );

  useEffect(() => {
    // In mock mode, just report as connected without actual subscription
    if (isMockMode) {
      setStatus('connected');
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setStatus('disconnected');
      return;
    }

    // Get round IDs from the store
    const roundIds = Object.keys(roundToUserMap);

    // Don't subscribe if we don't have any rounds yet
    if (roundIds.length === 0) {
      setStatus('connecting');
      return;
    }

    // Clean up any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create subscription channel
    const channel = supabase
      .channel(`scores-${eventId}`)
      .on<HoleScorePayload>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hole_scores',
          filter: `round_id=in.(${roundIds.join(',')})`,
        },
        handlePayload
      )
      .subscribe((subscriptionStatus) => {
        if (subscriptionStatus === 'SUBSCRIBED') {
          setStatus('connected');
          setError(null);
        } else if (subscriptionStatus === 'CLOSED') {
          setStatus('disconnected');
        } else if (subscriptionStatus === 'CHANNEL_ERROR') {
          setStatus('error');
          setError('Failed to connect to realtime updates');
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount or when dependencies change
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [eventId, roundToUserMap, handlePayload]);

  return { status, error };
}
