import React from 'react';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Calendar, Layers, Repeat, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useTranslations } from 'next-intl';

export interface RecentExpenseItem {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending';
  categoryName: string;
  categoryColor: string;
  payerName: string;
  payerRole: 'admin' | 'member' | 'child';
  payerAvatarKey: string;
  expenseType: 'single' | 'installment' | 'recurring';
  installmentInfo?: string; // e.g. "3/10"
  splitSummary?: string; // e.g. "Dividido 50% / 50%"
}

export interface RecentExpensesListProps {
  expenses: RecentExpenseItem[];
  onToggleStatus?: (expenseId: string, currentStatus: 'paid' | 'pending') => void;
  onEditExpense?: (expense: RecentExpenseItem) => void;
}

export const RecentExpensesList: React.FC<RecentExpensesListProps> = ({
  expenses,
  onToggleStatus,
  onEditExpense,
}) => {
  const tDash = useTranslations('Dashboard');
  const tCommon = useTranslations('Common');

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const today = new Date();

  return (
    <Card variant="elevated" className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-outline-variant/20 dark:border-white/[0.06] pb-3">
        <div>
          <h3 className="font-semibold text-on-surface">{tDash('recentExpenses')}</h3>
          <p className="text-xs text-on-surface-variant">{tDash('recentExpensesSubtitle')}</p>
        </div>
        <Link
          href="/expenses"
          className="text-xs font-medium text-primary hover:underline hover:brightness-110"
        >
          {tDash('viewAll')}
        </Link>
      </div>

      {expenses.length === 0 ? (
        <div className="py-8 text-center text-xs text-on-surface-variant">
          {tDash('noExpensesInPeriod')}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-outline-variant/20 dark:divide-white/[0.04]">
          {expenses.map((expense) => {
            let daysUntilDue = 999;
            try {
              daysUntilDue = differenceInCalendarDays(parseISO(expense.dueDate), today);
            } catch {}

            const isDueSoon = expense.status === 'pending' && daysUntilDue >= 0 && daysUntilDue <= 3;
            const isOverdue = expense.status === 'pending' && daysUntilDue < 0;

            return (
              <div
                key={expense.id}
                className="flex items-center justify-between py-3 transition-colors hover:bg-surface-container/50 px-2 rounded-m3-sm"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    name={expense.payerName}
                    role={expense.payerRole}
                    avatarKey={expense.payerAvatarKey}
                    size="sm"
                  />

                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-on-surface">
                        {expense.description}
                      </span>
                      {expense.expenseType === 'installment' && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-surface-container-highest px-1.5 py-0.5 text-[10px] font-semibold text-on-surface-variant">
                          <Layers className="h-2.5 w-2.5" />
                          {expense.installmentInfo}
                        </span>
                      )}
                      {expense.expenseType === 'recurring' && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-surface-container-highest px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          <Repeat className="h-2.5 w-2.5" />
                          Fixo
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {expense.dueDate}
                      </span>
                      <span>•</span>
                      <span
                        className="font-medium"
                        style={{ color: expense.categoryColor }}
                      >
                        {expense.categoryName}
                      </span>
                      {expense.splitSummary && (
                        <>
                          <span>•</span>
                          <span>{expense.splitSummary}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="font-semibold text-on-surface">
                    {formatCurrency(expense.amount)}
                  </span>
                  <div className="flex items-center gap-1">
                    {isOverdue && (
                      <span className="text-[10px] font-bold text-rose-500 flex items-center gap-0.5 bg-rose-500/10 px-1.5 py-0.5 rounded">
                        <AlertCircle className="h-2.5 w-2.5" /> Vencida
                      </span>
                    )}
                    {isDueSoon && (
                      <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        <AlertCircle className="h-2.5 w-2.5" /> Vence em {daysUntilDue === 0 ? 'Hoje' : `${daysUntilDue}d`}
                      </span>
                    )}
                    {onToggleStatus ? (
                      <button
                        onClick={() => onToggleStatus(expense.id, expense.status)}
                        title="Clique para alternar entre Pago e A Vencer"
                        className="focus:outline-none transition-transform active:scale-95"
                      >
                        <Badge variant={expense.status === 'paid' ? 'paid' : 'pending'}>
                          {expense.status === 'paid' ? '✓ Pago' : 'A Vencer'}
                        </Badge>
                      </button>
                    ) : (
                      <Badge variant={expense.status === 'paid' ? 'paid' : 'pending'}>
                        {expense.status === 'paid' ? '✓ Pago' : 'A Vencer'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
