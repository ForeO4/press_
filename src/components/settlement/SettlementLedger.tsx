'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTeeth } from '@/lib/utils';
import { TEETH_DISCLAIMER } from '@/lib/domain/settlement/computeSettlement';
import type { SettlementWithNames } from '@/types';

interface SettlementLedgerProps {
  settlements: SettlementWithNames[];
}

export function SettlementLedger({ settlements }: SettlementLedgerProps) {
  if (settlements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Settlement</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No settlements yet. Complete some games first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settlement</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Settlement table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium">Payer</th>
                  <th className="pb-2 text-center font-medium"></th>
                  <th className="pb-2 text-left font-medium">Payee</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((settlement) => (
                  <tr key={settlement.id} className="border-b last:border-0">
                    <td className="py-3">{settlement.payerName}</td>
                    <td className="py-3 text-center text-muted-foreground">
                      &rarr;
                    </td>
                    <td className="py-3">{settlement.payeeName}</td>
                    <td className="py-3 text-right font-medium text-primary">
                      {formatTeeth(settlement.amountInt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Disclaimer */}
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            <span className="mr-2">&#x26A0;</span>
            {TEETH_DISCLAIMER}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
