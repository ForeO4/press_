'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SettlementLedger } from '@/components/settlement/SettlementLedger';
import { mockSettlements } from '@/lib/mock/data';
import { mockUsers } from '@/lib/mock/users';
import { useAppStore } from '@/stores';
import { formatSettlementDisplay, computeNetPositions, TEETH_DISCLAIMER } from '@/lib/domain/settlement/computeSettlement';
import { formatTeeth } from '@/lib/utils';
import { isMockMode } from '@/lib/env/public';

export default function SettlementPage({
  params,
}: {
  params: { eventId: string };
}) {
  const mockUser = useAppStore((state) => state.mockUser);

  // In mock mode, use demo data
  const settlements = isMockMode ? mockSettlements : [];
  const canCompute = mockUser?.role === 'OWNER' || mockUser?.role === 'ADMIN';

  // Format settlements with names
  const settlementsWithNames = settlements.map((s) =>
    formatSettlementDisplay(s, (id) =>
      mockUsers.find((u) => u.id === id)?.name ?? 'Unknown'
    )
  );

  // Compute net positions
  const userIds = mockUsers.map((u) => u.id);
  const netPositions = computeNetPositions(settlements, userIds);

  const handleCompute = () => {
    alert('Settlement computation would happen here in a real app');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settlement</h1>
        {canCompute && (
          <Button onClick={handleCompute}>Compute Settlement</Button>
        )}
      </div>

      {/* Net Positions */}
      <Card>
        <CardHeader>
          <CardTitle>Net Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from(netPositions.entries())
              .sort(([, a], [, b]) => b - a)
              .map(([userId, amount]) => {
                const user = mockUsers.find((u) => u.id === userId);
                return (
                  <div
                    key={userId}
                    className="flex items-center justify-between rounded-md bg-gray-50 p-3"
                  >
                    <span>{user?.name ?? 'Unknown'}</span>
                    <span
                      className={`font-mono font-medium ${
                        amount > 0
                          ? 'text-green-600'
                          : amount < 0
                            ? 'text-red-600'
                            : 'text-gray-600'
                      }`}
                    >
                      {amount > 0 ? '+' : ''}
                      {formatTeeth(amount)}
                    </span>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Settlement Ledger */}
      <SettlementLedger settlements={settlementsWithNames} />

      {/* Disclaimer */}
      <div className="rounded-md bg-amber-50 p-4 text-center text-sm text-amber-800">
        <span className="mr-2">&#x26A0;</span>
        {TEETH_DISCLAIMER}
      </div>
    </div>
  );
}
