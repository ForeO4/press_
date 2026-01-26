'use client';

import { cn } from '@/lib/utils';
import { Flame, Trophy } from 'lucide-react';
import { AlligatorIcon } from '@/components/ui/AlligatorIcon';

interface GameSummaryHeaderProps {
  activeCount: number;
  completedCount: number;
  totalTeeth: number;
  className?: string;
}

export function GameSummaryHeader({
  activeCount,
  completedCount,
  totalTeeth,
  className,
}: GameSummaryHeaderProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/90 via-card/70 to-card/50 p-4 backdrop-blur-sm',
        className
      )}
    >
      {/* Subtle background pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.08),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.05),transparent_50%)]" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-5">
          {/* Active games */}
          <StatBlock
            icon={<Flame className="h-4 w-4" />}
            iconBg="bg-gradient-to-br from-orange-500/30 to-orange-600/10"
            iconColor="text-orange-400"
            value={activeCount}
            label="Active"
          />

          {/* Completed games */}
          <StatBlock
            icon={<Trophy className="h-4 w-4" />}
            iconBg="bg-gradient-to-br from-muted/40 to-muted/10"
            iconColor="text-muted-foreground"
            value={completedCount}
            label="Complete"
          />
        </div>

        {/* Total teeth at stake */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/5 ring-1 ring-primary/20">
            <AlligatorIcon size="lg" className="text-primary" />
          </div>
          <div className="text-right">
            <div className="text-xl font-bold leading-none tracking-tight text-primary">
              {totalTeeth}
            </div>
            <div className="text-xs font-medium text-muted-foreground">At Stake</div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatBlockProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  value: number;
  label: string;
}

function StatBlock({ icon, iconBg, iconColor, value, label }: StatBlockProps) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-white/5',
          iconBg
        )}
      >
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <div className="text-xl font-bold leading-none tracking-tight">{value}</div>
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
