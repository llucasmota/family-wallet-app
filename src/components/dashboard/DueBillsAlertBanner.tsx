'use client';

import React from 'react';
import { AlertCircle, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export interface DueBillsAlertBannerProps {
  alerts?: {
    overdueCount: number;
    overdueAmount: number;
    dueSoonCount: number;
    dueSoonAmount: number;
  };
  currency?: string;
}

export const DueBillsAlertBanner: React.FC<DueBillsAlertBannerProps> = ({
  alerts = { overdueCount: 0, overdueAmount: 0, dueSoonCount: 0, dueSoonAmount: 0 },
  currency = 'BRL',
}) => {
  const formatCurrency = (val: number) => {
    switch (currency) {
      case 'USD':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
      case 'EUR':
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);
      case 'BRL':
      default:
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    }
  };

  const hasOverdue = alerts.overdueCount > 0;
  const hasDueSoon = alerts.dueSoonCount > 0;

  if (!hasOverdue && !hasDueSoon) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {hasOverdue && (
        <div className="flex-1 flex items-center justify-between p-3.5 rounded-m3-md bg-rose-500/10 border border-rose-500/30 text-rose-500 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-m3-full bg-rose-500/20 text-rose-500">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold">
                {alerts.overdueCount} {alerts.overdueCount === 1 ? 'conta vencida' : 'contas vencidas'} ({formatCurrency(alerts.overdueAmount)})
              </p>
              <p className="text-[11px] text-rose-500/80">Evite juros e multas realizando o pagamento</p>
            </div>
          </div>

          <Link
            href="/expenses"
            className="text-xs font-semibold text-rose-500 hover:underline flex items-center gap-1 shrink-0 ml-2"
          >
            Pagar <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {hasDueSoon && (
        <div className="flex-1 flex items-center justify-between p-3.5 rounded-m3-md bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-m3-full bg-amber-500/20 text-amber-500">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold">
                {alerts.dueSoonCount} {alerts.dueSoonCount === 1 ? 'conta vence' : 'contas vencem'} nos próximos 3 dias ({formatCurrency(alerts.dueSoonAmount)})
              </p>
              <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80">Fique atento aos prazos dos boletos</p>
            </div>
          </div>

          <Link
            href="/expenses"
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 shrink-0 ml-2"
          >
            Ver <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};
