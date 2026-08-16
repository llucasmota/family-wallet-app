'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { CreditCard, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export interface C6CardInvoiceWidgetProps {
  c6Invoice?: {
    total: number;
    paid: number;
    pending: number;
    itemsCount: number;
    byMember: Array<{ memberName: string; amount: number }>;
  };
  currency?: string;
}

export const C6CardInvoiceWidget: React.FC<C6CardInvoiceWidgetProps> = ({
  c6Invoice = { total: 0, paid: 0, pending: 0, itemsCount: 0, byMember: [] },
  currency = 'BRL',
}) => {
  const tC6 = useTranslations('C6Card');

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

  const hasData = c6Invoice.total > 0;
  const isFullyPaid = hasData && c6Invoice.pending === 0;

  return (
    <Card
      variant="elevated"
      className="p-4 sm:p-5 border border-outline-variant/30 bg-surface-container/50 dark:bg-[#151A18] flex flex-col gap-3.5"
    >
      {/* Header: Title + Purchases Count + Link to Expenses */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-m3-md bg-[#1C1F1E] text-amber-400 border border-white/10 shadow-sm">
            <CreditCard className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="font-bold text-sm text-on-surface truncate">
              {tC6('title')}
            </h3>
            <span className="text-[11px] text-on-surface-variant">
              {tC6('purchasesCount', { count: c6Invoice.itemsCount })}
            </span>
          </div>
        </div>

        <Link
          href="/expenses"
          className="text-xs font-semibold text-primary hover:underline shrink-0 inline-flex items-center gap-1"
        >
          <span>{tC6('viewExpenses')}</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Main Invoice Value + Status Badge */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 pt-1 border-t border-outline-variant/15 dark:border-white/[0.04]">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">
            {tC6('invoiceTotal')}
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            {formatCurrency(c6Invoice.total)}
          </span>
        </div>

        {hasData && (
          <div>
            {isFullyPaid ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {tC6('statusPaid')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
                <Clock className="h-3.5 w-3.5" />
                {tC6('statusPending')}: {formatCurrency(c6Invoice.pending)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Responsibility Split Bar (if there are members) */}
      {hasData && c6Invoice.byMember.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/15 dark:border-white/[0.04]">
          <div className="flex items-center justify-between text-[11px] font-semibold text-on-surface-variant">
            <span>{tC6('splitTitle')}</span>
          </div>

          {/* Visual Proportion Bar */}
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
            {c6Invoice.byMember.map((m, idx) => {
              const pct = (m.amount / (c6Invoice.total || 1)) * 100;
              const colorClass = idx === 0 ? 'bg-primary' : 'bg-sky-500';
              return (
                <div
                  key={idx}
                  style={{ width: `${pct}%` }}
                  className={`h-full ${colorClass} transition-all duration-300`}
                  title={`${m.memberName}: ${pct.toFixed(0)}%`}
                />
              );
            })}
          </div>

          {/* Member Amount Chips */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {c6Invoice.byMember.map((m, idx) => {
              const pct = Math.round((m.amount / (c6Invoice.total || 1)) * 100);
              const dotColor = idx === 0 ? 'bg-primary' : 'bg-sky-500';
              return (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                  <span className="text-on-surface-variant font-medium">{m.memberName}:</span>
                  <span className="font-bold text-on-surface">{formatCurrency(m.amount)}</span>
                  <span className="text-[10px] text-on-surface-variant">({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};
