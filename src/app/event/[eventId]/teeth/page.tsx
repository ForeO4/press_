'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserBalance, getTransactionHistory } from '@/lib/services/settlement';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Wallet, ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react';
import { SETTLEMENT_LIVE } from '@/lib/env/public';

interface Transaction {
  id: string;
  event_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  description?: string;
  created_at: string;
}

export default function TeethPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const user = useCurrentUser();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || !eventId) return;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [bal, txns] = await Promise.all([
          getUserBalance(eventId, user!.id),
          getTransactionHistory(eventId, user!.id),
        ]);

        setBalance(bal);
        setTransactions(txns as Transaction[]);
      } catch (err) {
        console.error('Failed to load teeth data:', err);
        setError('Failed to load balance data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [eventId, user?.id]);

  if (!SETTLEMENT_LIVE) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Settlement feature coming soon</p>
            <p className="text-sm mt-2">Enable SETTLEMENT_LIVE flag to use this feature</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-8 text-center text-red-600">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Balance Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Gator Bucks Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {balance >= 0 ? '+' : ''}{balance} GB
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Your current balance for this event
          </p>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No transactions yet</p>
              <p className="text-sm mt-1">Complete games to see your Gator Bucks activity</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const isReceiving = tx.to_user_id === user?.id;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {isReceiving ? (
                        <div className="p-2 bg-green-100 rounded-full">
                          <ArrowDownLeft className="h-4 w-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="p-2 bg-red-100 rounded-full">
                          <ArrowUpRight className="h-4 w-4 text-red-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          {tx.description || 'Game Settlement'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-semibold ${isReceiving ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {isReceiving ? '+' : '-'}{tx.amount} GB
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
