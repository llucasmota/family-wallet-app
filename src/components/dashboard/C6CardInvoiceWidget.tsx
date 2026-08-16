'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { CreditCard, CheckCircle2, Clock, Users, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

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

  return (
    <Card variant="elevated" className="flex flex-col gap-4 p-5 border border-outline-variant/30 bg-surface-container/60 dark:bg-[#151A18] relative overflow-hidden">
      {/* Top Banner with C6 Carbon Style Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-m3-md bg-[#222222] text-white shadow-m3-1 border border-white/10">
            <CreditCard className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-on-surface">Fatura C6 Bank Compartilhada</h3>
              <span className="rounded bg-black/80 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-400/20">
                Cartão do Casal
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              {c6Invoice.itemsCount} {c6Invoice.itemsCount === 1 ? 'gasto registrado' : 'gastos registrados'} neste cartão
            </p>
          </div>
        </div>

        <Link
          href="/expenses"
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
        >
          Extrato <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Main Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="rounded-m3-md bg-surface p-3 border border-outline-variant/20 dark:bg-[#121614]">
          <span className="text-[11px] text-on-surface-variant block">Total da Fatura</span>
          <span className="text-xl font-extrabold text-on-surface tracking-tight">
            {formatCurrency(c6Invoice.total)}
          </span>
        </div>

        <div className="rounded-m3-md bg-surface p-3 border border-outline-variant/20 dark:bg-[#121614]">
          <span className="text-[11px] text-amber-500 font-semibold flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Em Aberto (A Vencer)
          </span>
          <span className="text-lg font-bold text-on-surface">
            {formatCurrency(c6Invoice.pending)}
          </span>
        </div>

        <div className="rounded-m3-md bg-surface p-3 border border-outline-variant/20 dark:bg-[#121614]">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Pago / Liquidado
          </span>
          <span className="text-lg font-bold text-on-surface">
            {formatCurrency(c6Invoice.paid)}
          </span>
        </div>
      </div>

      {/* Breakdown by Member (Quem gastou quanto no C6) */}
      {hasData && c6Invoice.byMember.length > 0 && (
        <div className="border-t border-outline-variant/20 dark:border-white/[0.06] pt-3 flex flex-col gap-2">
          <span className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" />
            Divisão de Consumo no Cartão C6 Bank:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {c6Invoice.byMember.map((m, idx) => {
              const pct = Math.round((m.amount / (c6Invoice.total || 1)) * 100);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-m3-sm bg-surface dark:bg-[#121614] border border-outline-variant/10"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-on-surface">{m.memberName}</span>
                    <span className="text-[10px] text-on-surface-variant">{pct}% da fatura</span>
                  </div>
                  <span className="font-bold text-on-surface">{formatCurrency(m.amount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};
