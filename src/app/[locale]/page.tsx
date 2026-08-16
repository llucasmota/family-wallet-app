'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { MetricCard } from '@/components/ui/MetricCard';
import { SpendingChart, CategorySpending } from '@/components/dashboard/SpendingChart';
import { RecentExpensesList, RecentExpenseItem } from '@/components/dashboard/RecentExpensesList';
import { CategoryBudgets, CategoryBudget } from '@/components/dashboard/CategoryBudgets';
import { MonthPicker } from '@/components/ui/MonthPicker';
import { AgentModal } from '@/components/agent/AgentModal';
import { QuickExpenseModal } from '@/components/dashboard/QuickExpenseModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DollarSign, Clock, CalendarDays, TrendingUp, Plus, Sparkles, Receipt } from 'lucide-react';
import { ExtractedExpenseDraft } from '@/services/ai/types';
import { getDashboardDataAction, addExpenseAction, toggleExpenseStatusAction } from '@/app/actions/expenses';
import { getFamilyDataAction } from '@/app/actions/family';

export default function DashboardPage() {
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [familyData, setFamilyData] = useState<{
    id: string;
    name: string;
    members: Array<{ id: string; displayName: string; role: any }>;
    categories: Array<{ id: string; name: string; color: string }>;
  } | null>(null);

  const [metrics, setMetrics] = useState({
    totalCurrentMonth: 0,
    totalPaid: 0,
    totalPending: 0,
    totalNextMonthCommitted: 0,
    trend: {
      trend: 'stable' as 'up' | 'down' | 'stable',
      percentageChange: 0,
    },
  });

  const [expenses, setExpenses] = useState<RecentExpenseItem[]>([]);
  const [categoriesChart, setCategoriesChart] = useState<CategorySpending[]>([]);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [historicalMonthly, setHistoricalMonthly] = useState<Array<{ month: string; amount: number }>>([]);

  const loadData = async (dateToLoad: Date = selectedDate) => {
    try {
      const famRes = await getFamilyDataAction();
      if (famRes.success && famRes.family) {
        setFamilyData(famRes.family as any);

        const dashRes = await getDashboardDataAction(
          famRes.family.id,
          dateToLoad.toISOString()
        );
        if (dashRes.success && dashRes.metrics) {
          setMetrics(dashRes.metrics as any);
          if (dashRes.recentExpenses) {
            setExpenses(dashRes.recentExpenses as any);

            // Compute category breakdown from recent items
            const catMap: Record<string, { amount: number; color: string }> = {};
            for (const exp of dashRes.recentExpenses) {
              const cName = exp.categoryName || 'Geral';
              const cColor = exp.categoryColor || '#2D7D62';
              if (!catMap[cName]) catMap[cName] = { amount: 0, color: cColor };
              catMap[cName].amount += exp.amount;
            }

            const total = Object.values(catMap).reduce((s, c) => s + c.amount, 0) || 1;
            const chartData: CategorySpending[] = Object.entries(catMap).map(([name, val]) => ({
              name,
              amount: val.amount,
              color: val.color,
              percentage: Math.round((val.amount / total) * 100),
            }));

            setCategoriesChart(chartData);

            // Compute Budgets & Targets
            const budgetsList: CategoryBudget[] = Object.entries(catMap).map(([name, val]) => {
              // Estipula um orçamento de referência saudável (ex: R$ 1.500 para Mercado, ou ~1.3x o gasto atual)
              const refBudget = val.amount > 1000 ? Math.ceil(val.amount * 1.25 / 100) * 100 : Math.max(500, Math.ceil(val.amount * 1.4 / 50) * 50);
              return {
                categoryName: name,
                categoryColor: val.color,
                spent: val.amount,
                budget: refBudget,
              };
            });

            setCategoryBudgets(budgetsList);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmAgentDraft = async (draft: ExtractedExpenseDraft) => {
    if (!familyData) return;

    await addExpenseAction({
      familyId: familyData.id,
      payerMemberId: familyData.members[0]?.id || '',
      categoryId: draft.categoryId || familyData.categories[0]?.id || '',
      description: draft.description,
      amount: draft.amount,
      dueDate: draft.dueDate,
      expenseType: draft.isInstallment ? 'installment' : 'single',
      installmentsCount: draft.totalInstallments || 1,
      status: 'paid',
      splits: familyData.members.map((m) => ({
        memberId: m.id,
        percentage: 100 / familyData.members.length,
      })),
    });

    loadData();
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface transition-colors duration-200">
      <Navbar
        onOpenAgent={() => setIsAgentOpen(true)}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {isLoading ? (
              <Skeleton className="h-8 w-56 mb-1" />
            ) : (
              <h1 className="text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
                {familyData?.name || 'Finanças da Família'}
              </h1>
            )}
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Visão consolidada de gastos compartilhados e projeções futuras
            </p>
          </div>

          <MonthPicker
            currentDate={selectedDate}
            onChange={(newDate) => {
              setSelectedDate(newDate);
              loadData(newDate);
            }}
          />
        </div>

        {/* 4 Metric Cards / Shimmer Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} variant="elevated" className="h-36 flex flex-col justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-3 w-44" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Gasto do Mês"
              value={metrics.totalCurrentMonth}
              subtitle="Mês Atual"
              icon={<DollarSign className="h-5 w-5" />}
            />
            <MetricCard
              title="Ainda a Vencer"
              value={metrics.totalPending}
              subtitle="Despesas pendentes"
              icon={<Clock className="h-5 w-5" />}
            />
            <MetricCard
              title="Previsão Próximo Mês"
              value={metrics.totalNextMonthCommitted}
              subtitle="Parcelas + Recorrências fixas"
              icon={<CalendarDays className="h-5 w-5" />}
            />
            <MetricCard
              title="Tendência de Gastos"
              value={
                metrics.trend.percentageChange !== 0
                  ? `${metrics.trend.percentageChange > 0 ? '+' : ''}${metrics.trend.percentageChange}%`
                  : 'Estável'
              }
              trend={metrics.trend.trend}
              trendLabel={
                metrics.trend.trend === 'down'
                  ? 'Abaixo da média dos últimos meses'
                  : metrics.trend.trend === 'up'
                  ? 'Acima da média dos últimos meses'
                  : 'Dentro da média'
              }
              subtitle="Comparado aos meses anteriores"
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </div>
        )}

        {/* Charts & Recent Expenses Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Card variant="elevated" className="lg:col-span-7 h-80 flex flex-col gap-4">
              <Skeleton className="h-5 w-40" />
              <div className="flex-1 flex items-center justify-center">
                <Skeleton className="h-44 w-44 rounded-full" />
              </div>
            </Card>
            <Card variant="elevated" className="lg:col-span-5 h-80 flex flex-col gap-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </Card>
          </div>
        ) : expenses.length === 0 ? (
          /* Empty State after clearing or first launch */
          <Card variant="elevated" className="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-m3-full bg-primary-container text-primary shadow-m3-1">
              <Receipt className="h-8 w-8" />
            </div>
            <div className="max-w-md flex flex-col gap-1">
              <h3 className="text-lg font-bold text-on-surface">Nenhum gasto registrado ainda</h3>
              <p className="text-xs text-on-surface-variant">
                Comece cadastrando sua primeira despesa compartilhada ou definindo um saldo inicial na família.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Button variant="filled" size="md" onClick={() => setIsQuickAddOpen(true)}>
                <Plus className="h-4 w-4" />
                Lançar Primeiro Gasto
              </Button>
              <Button variant="tonal" size="md" onClick={() => setIsAgentOpen(true)}>
                <Sparkles className="h-4 w-4 text-primary" />
                Usar Modo Agente
              </Button>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <SpendingChart
                  categories={categoriesChart}
                  historicalMonthly={
                    historicalMonthly.length > 0
                      ? historicalMonthly
                      : [{ month: 'Mês Atual', amount: metrics.totalCurrentMonth }]
                  }
                />
              </div>
              <div className="lg:col-span-5">
                <RecentExpensesList
                  expenses={expenses}
                  onToggleStatus={async (id, currentStatus) => {
                    await toggleExpenseStatusAction(id, currentStatus);
                    await loadData(selectedDate);
                  }}
                />
              </div>
            </div>

            {/* Category Budgets & Spending Goals */}
            {categoryBudgets.length > 0 && <CategoryBudgets budgets={categoryBudgets} />}
          </div>
        )}
      </main>

      {/* Modals */}
      <AgentModal
        isOpen={isAgentOpen}
        onClose={() => setIsAgentOpen(false)}
        onConfirmDraft={handleConfirmAgentDraft}
      />

      <QuickExpenseModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        familyId={familyData?.id}
        members={familyData?.members as any}
        categories={familyData?.categories as any}
        onSuccess={loadData}
      />
    </div>
  );
}
