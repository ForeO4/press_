'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Zap, Flame } from 'lucide-react';

interface PressButtonProps {
  baseStake: number;
  onPress: (multiplier: number) => void;
  disabled?: boolean;
}

const multipliers = [1, 2, 3, 4];

export function PressButton({
  baseStake,
  onPress,
  disabled = false,
}: PressButtonProps) {
  const [selectedMultiplier, setSelectedMultiplier] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePress = () => {
    if (selectedMultiplier) {
      onPress(selectedMultiplier);
      setSelectedMultiplier(null);
      setIsExpanded(false);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleMultiplierSelect = (multiplier: number) => {
    setSelectedMultiplier(multiplier);
  };

  const handleConfirmPress = () => {
    if (selectedMultiplier) {
      onPress(selectedMultiplier);
      setSelectedMultiplier(null);
      setIsExpanded(false);
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-300',
        isExpanded
          ? 'border-orange-500/50 bg-gradient-to-br from-orange-500/10 to-red-500/10'
          : 'border-border/30 bg-card/30'
      )}
    >
      {/* Main Press Button */}
      <button
        onClick={handlePress}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between p-4 transition-colors',
          'hover:bg-orange-500/5',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              'bg-gradient-to-br from-orange-500/20 to-red-500/20',
              'ring-1 ring-orange-500/30'
            )}
          >
            <Flame className="h-5 w-5 text-orange-400" />
          </div>
          <div className="text-left">
            <div className="font-bold text-orange-400">PRESS!</div>
            <div className="text-xs text-muted-foreground">
              Double down on the match
            </div>
          </div>
        </div>
        <Zap
          className={cn(
            'h-5 w-5 transition-transform',
            isExpanded ? 'rotate-90 text-orange-400' : 'text-muted-foreground'
          )}
        />
      </button>

      {/* Expanded Multiplier Options */}
      {isExpanded && (
        <div className="border-t border-orange-500/20 p-4 space-y-3">
          <div className="text-sm text-muted-foreground">Select press amount:</div>
          <div className="flex gap-2">
            {multipliers.map((mult) => (
              <button
                key={mult}
                onClick={() => handleMultiplierSelect(mult)}
                className={cn(
                  'flex-1 py-3 rounded-lg border-2 font-bold transition-all',
                  selectedMultiplier === mult
                    ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                    : 'border-border/30 bg-card/50 text-muted-foreground hover:border-orange-500/50'
                )}
              >
                <div className="text-lg">{mult}x</div>
                <div className="text-xs opacity-75">
                  {baseStake * mult} teeth
                </div>
              </button>
            ))}
          </div>

          {selectedMultiplier && (
            <Button
              onClick={handleConfirmPress}
              className="w-full gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <Flame className="h-4 w-4" />
              Confirm {selectedMultiplier}x Press ({baseStake * selectedMultiplier} teeth)
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
