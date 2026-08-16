'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { X, Printer, FileText, CheckCircle2, Clock, Users, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { extractPaymentMethod } from '@/services/payment-methods';

export interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyName?: string;
  selectedDate: Date;
  metrics: {
    totalCurrentMonth: number;
    totalPaid: number;
    totalPending: number;
    c6Invoice?: {
      total: number;
      paid: number;
      pending: number;
      byMember: Array<{ memberName: string; amount: number }>;
    };
  };
  expenses: any[];
  categories: any[];
  currency?: string;
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  isOpen,
  onClose,
  familyName = 'Minha Família',
  selectedDate,
  metrics,
  expenses = [],
  categories = [],
  currency = 'BRL',
}) => {
  if (!isOpen) return null;

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

  const monthLabel = format(selectedDate, 'MMMM yyyy', { locale: ptBR });
  const capitalizedMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
  const printDate = format(new Date(), "dd/MM/yyyy 'às' HH:mm");

  const handlePrint = () => {
    window.print();
  };

  // Compute category totals
  const catTotals: Record<string, { name: string; amount: number; color: string }> = {};
  for (const exp of expenses) {
    const cName = exp.categoryName || 'Geral';
    const cColor = exp.categoryColor || '#2E7D5E';
    if (!catTotals[cName]) catTotals[cName] = { name: cName, amount: 0, color: cColor };
    catTotals[cName].amount += parseFloat(exp.amount);
  }
  const categoryList = Object.values(catTotals).sort((a, b) => b.amount - a.amount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static">
      <Card
        variant="elevated"
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto flex flex-col gap-6 p-6 shadow-m3-3 print:max-h-none print:shadow-none print:border-none print:p-8 print:w-full"
      >
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 dark:border-white/[0.06] pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-bold text-sm text-on-surface">Relatório Mensal de Fechamento</h3>
              <p className="text-xs text-on-surface-variant">Extrato executivo para análise do casal</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="filled" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
              <Printer className="h-4 w-4" />
              Imprimir / Salvar PDF
            </Button>
            <Button variant="text" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Printable Report Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-black/10 dark:border-white/10 pb-4 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-primary">Family Wallet</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                Fechamento Oficial
              </span>
            </div>
            <h1 className="text-2xl font-bold text-on-surface mt-1">{familyName}</h1>
            <p className="text-xs text-on-surface-variant">Competência: <strong>{capitalizedMonth}</strong></p>
          </div>

          <div className="text-left sm:text-right text-[11px] text-on-surface-variant">
            <p>Gerado em: <strong>{printDate}</strong></p>
            <p>Moeda: <strong>{currency}</strong></p>
          </div>
        </div>

        {/* Executive KPI Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-m3-md bg-surface-container/60 dark:bg-[#141816] border border-outline-variant/20">
            <span className="text-on-surface-variant block text-[11px]">Total Geral</span>
            <span className="text-base font-extrabold text-on-surface">
              {formatCurrency(metrics.totalCurrentMonth)}
            </span>
          </div>

          <div className="p-3 rounded-m3-md bg-surface-container/60 dark:bg-[#141816] border border-outline-variant/20">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold block text-[11px]">
              ✓ Pago
            </span>
            <span className="text-base font-bold text-on-surface">
              {formatCurrency(metrics.totalPaid)}
            </span>
          </div>

          <div className="p-3 rounded-m3-md bg-surface-container/60 dark:bg-[#141816] border border-outline-variant/20">
            <span className="text-amber-500 font-semibold block text-[11px]">
              A Vencer
            </span>
            <span className="text-base font-bold text-on-surface">
              {formatCurrency(metrics.totalPending)}
            </span>
          </div>

          <div className="p-3 rounded-m3-md bg-surface-container/60 dark:bg-[#141816] border border-outline-variant/20">
            <span className="text-on-surface-variant font-semibold block text-[11px]">
              💳 Fatura C6 Bank
            </span>
            <span className="text-base font-bold text-on-surface">
              {formatCurrency(metrics.c6Invoice?.total || 0)}
            </span>
          </div>
        </div>

        {/* C6 Bank Card Breakdown */}
        {metrics.c6Invoice && metrics.c6Invoice.byMember.length > 0 && (
          <div className="rounded-m3-md border border-outline-variant/30 bg-surface p-4 text-xs">
            <h3 className="font-bold text-on-surface mb-2 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-amber-500" />
              Consumo do Cartão C6 Bank Compartilhado
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {metrics.c6Invoice.byMember.map((m, i) => (
                <div key={i} className="flex justify-between items-center p-2 rounded bg-surface-container/40">
                  <span className="font-semibold text-on-surface">{m.memberName}</span>
                  <span className="font-bold text-on-surface">{formatCurrency(m.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Breakdown Table */}
        <div className="flex flex-col gap-2 text-xs">
          <h3 className="font-bold text-on-surface">Distribuição por Categorias</h3>
          <div className="border border-outline-variant/20 rounded-m3-md overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-surface-container text-on-surface-variant font-semibold border-b border-outline-variant/20">
                <tr>
                  <th className="p-2.5">Categoria</th>
                  <th className="p-2.5 text-right">Valor Total</th>
                  <th className="p-2.5 text-right">% do Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {categoryList.map((c, i) => {
                  const pct = Math.round((c.amount / (metrics.totalCurrentMonth || 1)) * 100);
                  return (
                    <tr key={i}>
                      <td className="p-2.5 font-medium flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </td>
                      <td className="p-2.5 text-right font-semibold">{formatCurrency(c.amount)}</td>
                      <td className="p-2.5 text-right text-on-surface-variant">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Item List */}
        <div className="flex flex-col gap-2 text-xs">
          <h3 className="font-bold text-on-surface">Extrato de Lançamentos ({expenses.length})</h3>
          <div className="border border-outline-variant/20 rounded-m3-md overflow-hidden">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-surface-container text-on-surface-variant font-semibold border-b border-outline-variant/20">
                <tr>
                  <th className="p-2">Vencimento</th>
                  <th className="p-2">Descrição</th>
                  <th className="p-2">Pagador</th>
                  <th className="p-2">Meio</th>
                  <th className="p-2 text-right">Valor</th>
                  <th className="p-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {expenses.map((e, idx) => {
                  const pMethod = extractPaymentMethod(e.notes);
                  const pLabel = pMethod === 'c6_card' ? '💳 C6 Bank' : pMethod === 'pix' ? '💠 Pix' : '💵 Dinheiro';
                  return (
                    <tr key={idx}>
                      <td className="p-2 text-on-surface-variant whitespace-nowrap">{e.dueDate}</td>
                      <td className="p-2 font-medium text-on-surface">{e.description}</td>
                      <td className="p-2 text-on-surface-variant">{e.payerName}</td>
                      <td className="p-2 text-on-surface-variant whitespace-nowrap">{pLabel}</td>
                      <td className="p-2 text-right font-bold text-on-surface">{formatCurrency(e.amount)}</td>
                      <td className="p-2 text-right">
                        <span className={e.status === 'paid' ? 'text-emerald-600 font-semibold' : 'text-amber-500 font-semibold'}>
                          {e.status === 'paid' ? 'Pago' : 'A Vencer'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Printable Footer */}
        <div className="border-t border-black/10 dark:border-white/10 pt-4 text-center text-[10px] text-on-surface-variant">
          <p>Family Wallet — Organização e harmonia financeira compartilhada.</p>
        </div>
      </Card>
    </div>
  );
};
