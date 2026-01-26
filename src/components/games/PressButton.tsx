'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Zap, Flame, Sparkles } from 'lucide-react';
import { AlligatorIcon } from '@/components/ui/AlligatorIcon';

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
  const [isAnimating, setIsAnimating] = useState(false);

  const handlePress = () => {
    if (selectedMultiplier) {
      setIsAnimating(true);
      setTimeout(() => {
        onPress(selectedMultiplier);
        setSelectedMultiplier(null);
        setIsExpanded(false);
        setIsAnimating(false);
      }, 300);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleMultiplierSelect = (multiplier: number) => {
    setSelectedMultiplier(multiplier);
  };

  const handleConfirmPress = () => {
    if (selectedMultiplier) {
      setIsAnimating(true);
      setTimeout(() => {
        onPress(selectedMultiplier);
        setSelectedMultiplier(null);
        setIsExpanded(false);
        setIsAnimating(false);
      }, 300);
    }
  };

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 transition-all duration-300 overflow-hidden',
        isExpanded
          ? 'border-amber-500/70 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-red-500/15'
          : 'border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-orange-500/5 hover:border-amber-500/60',
        isAnimating && 'scale-95'
      )}
    >
      {/* Animated background glow */}
      <div className={cn(
        'absolute inset-0 opacity-0 transition-opacity duration-500',
        isExpanded && 'opacity-100'
      )}>
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 animate-pulse" />
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/10 to-red-500/10 blur-xl" />
      </div>

      {/* Main Press Button */}
      <button
        onClick={handlePress}
        disabled={disabled}
        className={cn(
          'relative w-full flex items-center justify-between p-4 transition-all duration-200',
          'hover:bg-amber-500/10',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="flex items-center gap-4">
          {/* Animated icon container */}
          <div
            className={cn(
              'relative flex h-14 w-14 items-center justify-center rounded-xl',
              'bg-gradient-to-br from-amber-500/30 via-orange-500/25 to-red-500/30',
              'ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/20',
              isExpanded && 'animate-pulse'
            )}
          >
            {/* Sparkle effects */}
            <Sparkles className={cn(
              'absolute -top-1 -right-1 h-4 w-4 text-amber-300 transition-all',
              isExpanded ? 'opacity-100 animate-bounce' : 'opacity-0'
            )} />
            <Flame className={cn(
              'h-7 w-7 transition-all duration-300',
              isExpanded ? 'text-amber-300 scale-110' : 'text-amber-400'
            )} />
          </div>
          <div className="text-left">
            <div className={cn(
              'text-xl font-black tracking-wide transition-all',
              'bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent',
              isExpanded && 'from-amber-300 via-orange-300 to-red-300'
            )}>
              PRESS!
            </div>
            <div className="text-sm text-amber-400/80 font-medium">
              {isExpanded ? 'Choose your stake' : 'Double down on the match'}
            </div>
          </div>
        </div>
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300',
          'bg-amber-500/20 ring-1 ring-amber-500/30',
          isExpanded && 'rotate-180 bg-amber-500/30'
        )}>
          <Zap
            className={cn(
              'h-5 w-5 transition-colors',
              isExpanded ? 'text-amber-300' : 'text-amber-400'
            )}
          />
        </div>
      </button>

      {/* Expanded Multiplier Options */}
      <div className={cn(
        'grid transition-all duration-300 ease-out',
        isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      )}>
        <div className="overflow-hidden">
          <div className="relative border-t-2 border-amber-500/30 p-4 space-y-4">
            {/* Multiplier grid */}
            <div className="grid grid-cols-4 gap-2">
              {multipliers.map((mult) => (
                <button
                  key={mult}
                  onClick={() => handleMultiplierSelect(mult)}
                  className={cn(
                    'relative py-4 rounded-xl border-2 font-bold transition-all duration-200',
                    'overflow-hidden',
                    selectedMultiplier === mult
                      ? 'border-amber-500 bg-gradient-to-br from-amber-500/30 to-orange-500/30 text-amber-300 scale-105 shadow-lg shadow-amber-500/30'
                      : 'border-amber-500/30 bg-card/50 text-amber-400/70 hover:border-amber-500/50 hover:bg-amber-500/10'
                  )}
                >
                  {/* Selection glow */}
                  {selectedMultiplier === mult && (
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent animate-pulse" />
                  )}
                  <div className="relative">
                    <div className="text-2xl font-black">{mult}x</div>
                    <div className="flex items-center justify-center gap-1 text-xs opacity-80 mt-1">
                      <AlligatorIcon size="sm" className="text-current" />
                      <span>{baseStake * mult}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Confirm button */}
            <Button
              onClick={handleConfirmPress}
              disabled={!selectedMultiplier}
              className={cn(
                'w-full h-14 gap-3 text-lg font-bold transition-all duration-200',
                'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500',
                'hover:from-amber-400 hover:via-orange-400 hover:to-red-400',
                'shadow-lg hover:shadow-xl hover:shadow-amber-500/30',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
                selectedMultiplier && 'animate-pulse'
              )}
            >
              <Flame className="h-5 w-5" />
              {selectedMultiplier ? (
                <span className="flex items-center gap-2">
                  Press for
                  <span className="flex items-center gap-1">
                    <AlligatorIcon size="md" className="text-white" />
                    {baseStake * selectedMultiplier}
                  </span>
                </span>
              ) : (
                'Select a multiplier'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
