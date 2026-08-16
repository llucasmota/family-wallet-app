'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Search, Filter, Plus, Layers, Repeat, Trash2, CheckCircle2, Circle, Download, Pencil, FileText, CreditCard } from 'lucide-react';
import { QuickExpenseModal } from '@/components/dashboard/QuickExpenseModal';
import { EditExpenseModal } from '@/components/dashboard/EditExpenseModal';
import { MonthlyReportModal } from '@/components/dashboard/MonthlyReportModal';
import { PWAInstallPrompt } from '@/components/ui/PWAInstallPrompt';
import { AgentModal } from '@/components/agent/AgentModal';
import { MonthPicker } from '@/components/ui/MonthPicker';
import { getFamilyDataAction } from '@/app/actions/family';
import { getDashboardDataAction, toggleExpenseStatusAction, deleteExpenseAction } from '@/app/actions/expenses';
import { extractPaymentMethod } from '@/services/payment-methods';

export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [familyData, setFamilyData] = useState<{
    id: string;
    name?: string;
    currency?: string;
    members: any[];
    categories: any[];
  } | null>(null);

  const [metrics, setMetrics] = useState<any>({
    totalCurrentMonth: 0,
    totalPaid: 0,
    totalPending: 0,
    c6Invoice: { total: 0, paid: 0, pending: 0, byMember: [] },
  });

  const [expenses, setExpenses] = useState<any[]>([]);

  const loadExpenses = async (dateToLoad: Date = selectedDate) => {
    try {
      const famRes = await getFamilyDataAction();
      if (famRes.success && famRes.family) {
        setFamilyData(famRes.family as any);
        const dashRes = await getDashboardDataAction(
          famRes.family.id,
          dateToLoad.toISOString()
        );
        if (dashRes.success) {
          if (dashRes.metrics) setMetrics(dashRes.metrics as any);
          if (dashRes.recentExpenses) setExpenses(dashRes.recentExpenses);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleToggleStatus = async (expenseId: string, currentStatus: 'paid' | 'pending') => {
    await toggleExpenseStatusAction(expenseId, currentStatus);
    await loadExpenses();
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (confirm('Deseja realmente excluir este lançamento?')) {
      await deleteExpenseAction(expenseId);
      await loadExpenses();
    }
  };

  const filtered = expenses.filter((e) => {
    const matchesSearch =
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.categoryName && e.categoryName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    if (filtered.length === 0) return;

    const headers = ['Vencimento', 'Descrição', 'Categoria', 'Pagador', 'Divisão', 'Valor (R$)', 'Status'];
    const rows = filtered.map((e) => [
      e.dueDate,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${e.categoryName || ''}"`,
      `"${e.payerName || ''}"`,
      `"${e.splitSummary || ''}"`,
      e.amount.toFixed(2),
      e.status === 'paid' ? 'Pago' : 'A Vencer',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `extrato-family-wallet-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="min-h-screen flex flex-col bg-surface transition-colors duration-200">
      <Navbar
        onOpenAgent={() => setIsAgentOpen(true)}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 pb-28 sm:pb-8 sm:px-6 lg:px-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
              Extrato de Despesas
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Histórico detalhado, divisões de contas e busca em tempo real
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <MonthPicker
              currentDate={selectedDate}
              onChange={(newDate) => {
                setSelectedDate(newDate);
                loadExpenses(newDate);
              }}
            />
            <Button
              variant="outlined"
              size="sm"
              onClick={() => setIsReportOpen(true)}
              className="gap-1.5 text-xs h-9"
            >
              <FileText className="h-4 w-4 text-primary" />
              Relatório (PDF)
            </Button>
            <Button variant="outlined" size="sm" onClick={handleExportCSV} className="gap-1.5 text-xs h-9">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button variant="filled" size="sm" onClick={() => setIsQuickAddOpen(true)} className="gap-1.5 text-xs h-9">
              <Plus className="h-4 w-4" />
              Lançar Despesa
            </Button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <Card variant="elevated" className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-on-surface-variant" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descrição ou categoria..."
              className="w-full rounded-m3-md border border-outline-variant/30 bg-surface dark:bg-[#141816] pl-9 pr-3 py-1.5 text-xs text-on-surface focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Status:
            </span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-m3-full text-xs font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-surface-container dark:bg-[#141816] text-on-surface-variant'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1 rounded-m3-full text-xs font-medium transition-colors ${
                statusFilter === 'paid'
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-surface-container dark:bg-[#141816] text-on-surface-variant'
              }`}
            >
              Pagos
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-m3-full text-xs font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-surface-container dark:bg-[#141816] text-on-surface-variant'
              }`}
            >
              A Vencer
            </button>
          </div>
        </Card>

        {/* Expenses List: Mobile Cards + Desktop Table */}
        <div className="flex flex-col gap-4">
          {/* Mobile View: Clean grouped transaction cards */}
          <div className="flex flex-col gap-3 block md:hidden">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <Card key={i} variant="elevated" className="p-4 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-surface-container-highest" />
                    <div className="flex flex-col gap-1.5">
                      <div className="h-4 w-32 rounded bg-surface-container-highest" />
                      <div className="h-3 w-20 rounded bg-surface-container-highest" />
                    </div>
                  </div>
                  <div className="h-5 w-16 rounded bg-surface-container-highest" />
                </Card>
              ))
            ) : filtered.length === 0 ? (
              <Card variant="elevated" className="py-12 text-center text-on-surface-variant text-xs">
                Nenhuma despesa encontrada para os filtros selecionados.
              </Card>
            ) : (
              filtered.map((item) => {
                const pMethod = extractPaymentMethod(item.notes);
                const pBadge = pMethod === 'c6_card' ? '💳 C6' : pMethod === 'pix' ? '💠 PIX' : '💵 Dinheiro';

                return (
                  <Card key={item.id} variant="elevated" className="p-4 flex flex-col gap-2.5 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={item.payerName} avatarKey={item.payerAvatarKey} size="md" />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-on-surface text-sm">{item.description}</span>
                            {item.expenseType === 'installment' && (
                              <span className="inline-flex items-center gap-0.5 rounded bg-surface-container-highest px-1.5 py-0.2 text-[9px] font-semibold text-on-surface-variant">
                                <Layers className="h-2.5 w-2.5" />
                                {item.installmentInfo}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant mt-0.5">
                            <span className="font-semibold" style={{ color: item.categoryColor }}>
                              {item.categoryName}
                            </span>
                            <span>•</span>
                            <span>{item.dueDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="font-bold text-base text-on-surface">
                          {formatCurrency(item.amount)}
                        </span>
                        <span className="text-[10px] text-on-surface-variant">{pBadge}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-outline-variant/15 dark:border-white/[0.04] text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item.id, item.status)}
                          className="focus:outline-none transition-transform active:scale-95"
                        >
                          <Badge variant={item.status === 'paid' ? 'paid' : 'pending'}>
                            {item.status === 'paid' ? '✓ Pago' : 'A Vencer'}
                          </Badge>
                        </button>
                        <span className="text-[10px] text-on-surface-variant">{item.splitSummary}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingExpense(item)}
                          title="Editar despesa"
                          className="p-1.5 rounded-m3-sm border border-outline-variant/20 text-on-surface-variant hover:text-primary hover:bg-surface-container"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(item.id)}
                          title="Excluir despesa"
                          className="p-1.5 rounded-m3-sm border border-outline-variant/20 text-on-surface-variant hover:text-error hover:bg-error/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {/* Desktop Table */}
          <Card variant="elevated" className="p-0 overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-high dark:bg-[#151A18] text-on-surface-variant font-semibold border-b border-outline-variant/20 dark:border-white/[0.06]">
                  <tr>
                    <th className="py-3.5 px-4">Descrição & Categoria</th>
                    <th className="py-3.5 px-4">Pagador</th>
                    <th className="py-3.5 px-4">Meio</th>
                    <th className="py-3.5 px-4">Divisão</th>
                    <th className="py-3.5 px-4">Vencimento</th>
                    <th className="py-3.5 px-4">Valor</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 dark:divide-white/[0.04]">
                  {isLoading ? (
                    [1, 2, 3, 4].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="h-3.5 w-36 rounded bg-surface-container-highest dark:bg-white/[0.06]" />
                            <div className="h-2.5 w-20 rounded bg-surface-container-highest dark:bg-white/[0.04]" />
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="h-6 w-24 rounded bg-surface-container-highest dark:bg-white/[0.06]" />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="h-4 w-16 rounded bg-surface-container-highest dark:bg-white/[0.04]" />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="h-3 w-16 rounded bg-surface-container-highest dark:bg-white/[0.04]" />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="h-3 w-20 rounded bg-surface-container-highest dark:bg-white/[0.04]" />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="h-4 w-20 rounded bg-surface-container-highest dark:bg-white/[0.06]" />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="h-5 w-14 rounded-full bg-surface-container-highest dark:bg-white/[0.06]" />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="h-6 w-12 rounded bg-surface-container-highest dark:bg-white/[0.06] ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-on-surface-variant">
                        Nenhuma despesa encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => {
                      const pMethod = extractPaymentMethod(item.notes);
                      const pBadge =
                        pMethod === 'c6_card' ? '💳 C6 Bank' : pMethod === 'pix' ? '💠 PIX' : '💵 Dinheiro';

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-surface-container/50 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-3 px-4 font-medium text-on-surface">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <span>{item.description}</span>
                                {item.expenseType === 'installment' && (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-surface-container-highest px-1.5 py-0.5 text-[10px] font-semibold text-on-surface-variant">
                                    <Layers className="h-2.5 w-2.5" />
                                    {item.installmentInfo}
                                  </span>
                                )}
                                {item.expenseType === 'recurring' && (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-surface-container-highest px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                    <Repeat className="h-2.5 w-2.5" />
                                    Fixo
                                  </span>
                                )}
                              </div>
                              <span
                                className="text-[11px] font-medium"
                                style={{ color: item.categoryColor }}
                              >
                                {item.categoryName}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Avatar name={item.payerName} avatarKey={item.payerAvatarKey} size="sm" />
                              <span>{item.payerName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-on-surface-variant whitespace-nowrap">
                            <span className="rounded bg-surface-container px-2 py-0.5 text-[10px] font-semibold border border-outline-variant/20">
                              {pBadge}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-on-surface-variant">{item.splitSummary}</td>
                          <td className="py-3 px-4 text-on-surface-variant">{item.dueDate}</td>
                          <td className="py-3 px-4 font-bold text-on-surface">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleStatus(item.id, item.status)}
                              title="Clique para alternar entre Pago e A Vencer"
                              className="focus:outline-none transition-transform active:scale-95"
                            >
                              <Badge variant={item.status === 'paid' ? 'paid' : 'pending'}>
                                {item.status === 'paid' ? '✓ Pago' : 'A Vencer'}
                              </Badge>
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setEditingExpense(item)}
                                title="Editar despesa / status"
                                className="text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded hover:bg-surface-container"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(item.id)}
                                title="Excluir lançamento"
                                className="text-on-surface-variant hover:text-error transition-colors p-1.5 rounded hover:bg-surface-container"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>

      <QuickExpenseModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        familyId={familyData?.id}
        members={familyData?.members}
        categories={familyData?.categories}
        onSuccess={loadExpenses}
        onOpenAgent={() => setIsAgentOpen(true)}
      />

      <EditExpenseModal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        expense={editingExpense}
        members={familyData?.members}
        categories={familyData?.categories}
        currency={familyData?.currency || 'BRL'}
        onSuccess={loadExpenses}
      />

      <MonthlyReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        familyName={familyData?.name}
        selectedDate={selectedDate}
        metrics={metrics}
        expenses={expenses}
        categories={familyData?.categories || []}
        currency={familyData?.currency || 'BRL'}
      />

      <AgentModal
        isOpen={isAgentOpen}
        onClose={() => setIsAgentOpen(false)}
        onConfirmDraft={() => loadExpenses()}
      />

      <PWAInstallPrompt />
    </div>
  );
}
