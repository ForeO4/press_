'use client';

import { Card, CardContent } from '@/components/ui/card';
import { AlligatorIcon } from '@/components/ui/AlligatorIcon';
import { cn } from '@/lib/utils';
import type { GatorBucksBalance } from '@/types';

interface BalanceCardProps {
  balance: GatorBucksBalance | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function BalanceCard({ balance, className, size = 'md' }: BalanceCardProps) {
  const amount = balance?.balanceInt ?? 0;

  const sizeStyles = {
    sm: {
      card: 'p-3',
      icon: 'md' as const,
      text: 'text-xl',
      label: 'text-xs',
    },
    md: {
      card: 'p-4',
      icon: 'lg' as const,
      text: 'text-2xl',
      label: 'text-sm',
    },
    lg: {
      card: 'p-6',
      icon: 'xl' as const,
      text: 'text-4xl',
      label: 'text-base',
    },
  };

  const styles = sizeStyles[size];

  return (
    <Card className={cn('bg-gradient-to-br from-primary/10 to-primary/5', className)}>
      <CardContent className={cn('flex items-center justify-between', styles.card)}>
        <div>
          <p className={cn('text-muted-foreground', styles.label)}>Your Balance</p>
          <div className="flex items-center gap-2 mt-1">
            <AlligatorIcon size={styles.icon} className="text-primary" />
            <span className={cn('font-bold text-primary', styles.text)}>
              {amount}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className={cn('text-muted-foreground', styles.label)}>Gator Bucks</p>
        </div>
      </CardContent>
    </Card>
  );
}
