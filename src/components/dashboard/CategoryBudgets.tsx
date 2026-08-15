'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { Target, TrendingUp, AlertTriangle } from 'lucide-react';

export interface CategoryBudget {
  categoryName: string;
  categoryColor: string;
  spent: number;
  budget: number;
}

export interface CategoryBudgetsProps {
  budgets: CategoryBudget[];
}

export const CategoryBudgets: React.FC<CategoryBudgetsProps> = ({ budgets }) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (budgets.length === 0) return null;

  return (
    <Card variant="elevated" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-on-surface text-sm">Metas & Orçamentos do Mês</h3>
        </div>
        <span className="text-[11px] text-on-surface-variant font-medium">
          Acompanhamento em tempo real
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map((item, idx) => {
          const percentage = Math.min(Math.round((item.spent / item.budget) * 100), 100);
          const isOver = item.spent > item.budget;
          const isWarning = percentage >= 80 && !isOver;

          return (
            <div
              key={idx}
              className="flex flex-col gap-2 rounded-m3-md bg-surface-container dark:bg-[#141816] p-3.5"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.categoryColor }}
                  />
                  <span className="font-semibold text-on-surface">{item.categoryName}</span>
                </div>
                <div className="flex items-center gap-1 font-bold">
                  <span className={isOver ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-on-surface'}>
                    {formatCurrency(item.spent)}
                  </span>
                  <span className="text-on-surface-variant font-normal">/ {formatCurrency(item.budget)}</span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-container-highest dark:bg-white/[0.08]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-primary'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-on-surface-variant">
                <span>{percentage}% do orçamento</span>
                {isOver && (
                  <span className="text-rose-500 font-bold flex items-center gap-0.5">
                    <AlertTriangle className="h-3 w-3" /> Limite excedido!
                  </span>
                )}
                {isWarning && <span className="text-amber-500 font-medium">Atenção ao limite</span>}
                {!isOver && !isWarning && <span className="text-primary font-medium">Dentro da meta</span>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
