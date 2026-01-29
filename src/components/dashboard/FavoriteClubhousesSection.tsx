'use client';

import { Button } from '@/components/ui/button';
import { ClubhouseCard } from './ClubhouseCard';
import { Star } from 'lucide-react';
import type { FavoriteClubhouse } from '@/types';

interface FavoriteClubhousesSectionProps {
  favorites: FavoriteClubhouse[];
  onToggleFavorite: (eventId: string) => void;
  isLoading?: boolean;
}

export function FavoriteClubhousesSection({
  favorites,
  onToggleFavorite,
  isLoading,
}: FavoriteClubhousesSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Favorite Clubhouses
          </h2>
        </div>
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
          <h2 className="text-lg font-semibold text-foreground">
            Favorite Clubhouses
          </h2>
        </div>
        <Button variant="ghost" size="sm" className="text-xs">
          Edit
        </Button>
      </div>

      <div className="space-y-2">
        {favorites.map((favorite) => (
          <ClubhouseCard
            key={favorite.id}
            event={favorite.event}
            isFavorite={true}
            showFavoriteButton={true}
            onToggleFavorite={() => onToggleFavorite(favorite.eventId)}
          />
        ))}
      </div>
    </div>
  );
}
