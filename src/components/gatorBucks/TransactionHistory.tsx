'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlligatorIcon } from '@/components/ui/AlligatorIcon';
import { formatTimeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { GatorBucksTransaction } from '@/types';

interface TransactionHistoryProps {
  transactions: GatorBucksTransaction[];
  className?: string;
}

export function TransactionHistory({ transactions, className }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlligatorIcon size="md" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No transactions yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlligatorIcon size="md" />
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((txn) => (
            <div
              key={txn.id}
              className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{txn.reason}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTimeAgo(txn.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    'text-sm font-bold',
                    txn.deltaInt > 0 ? 'text-green-500' : 'text-red-500'
                  )}
                >
                  {txn.deltaInt > 0 ? '+' : ''}
                  {txn.deltaInt}
                </p>
                <p className="text-xs text-muted-foreground">
                  Balance: {txn.balanceInt}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
