'use client';

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CurrencyInput } from '../ui/CurrencyInput';
import { Toast } from '../ui/Toast';
import { X, Layers, Repeat, Users, Check, Loader2, ArrowRightLeft, DollarSign } from 'lucide-react';
import { addExpenseAction } from '@/app/actions/expenses';
import { recordSettlementAction, getFamilyDataAction } from '@/app/actions/family';
import { DEFAULT_CATEGORIES } from '@/db/default-categories';

export interface QuickExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyId?: string;
  members?: Array<{ id: string; displayName: string; role: string }>;
  categories?: Array<{ id: string; name: string; color: string }>;
  onSuccess?: () => void;
}

export const QuickExpenseModal: React.FC<QuickExpenseModalProps> = ({
  isOpen,
  onClose,
  familyId,
  members = [],
  categories = [],
  onSuccess,
}) => {
  const [liveFamilyId, setLiveFamilyId] = useState(familyId || '');
  const [liveMembers, setLiveMembers] = useState(members);
  const [liveCategories, setLiveCategories] = useState(categories);

  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error'; isVisible: boolean }>({
    message: '',
    isVisible: false,
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  // Dynamically load family data if not provided via props
  React.useEffect(() => {
    if (isOpen && (!liveFamilyId || liveMembers.length === 0 || liveCategories.length === 0)) {
      getFamilyDataAction().then((res) => {
        if (res.success && res.family) {
          setLiveFamilyId(res.family.id);
          if (res.family.members && res.family.members.length > 0) {
            setLiveMembers(res.family.members as any);
          }
          if (res.family.categories && res.family.categories.length > 0) {
            setLiveCategories(res.family.categories as any);
          }
        }
      });
    }
  }, [isOpen, liveFamilyId, liveMembers.length, liveCategories.length]);

  const activeCategories =
    liveCategories && liveCategories.length > 0
      ? liveCategories
      : DEFAULT_CATEGORIES.map((c, i) => ({ id: `cat-${i}`, name: c.name, color: c.color }));

  const activeMembers =
    liveMembers && liveMembers.length > 0
      ? liveMembers
      : [
          { id: '1', displayName: 'Administrador', role: 'admin' },
        ];

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [payerMemberId, setPayerMemberId] = useState('');
  const [expenseType, setExpenseType] = useState<'single' | 'installment' | 'recurring' | 'initial_credit'>('single');
  const [installments, setInstallments] = useState(3);
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [customHusband, setCustomHusband] = useState(50);
  const [customWife, setCustomWife] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial Credit Form State
  const [creditorId, setCreditorId] = useState('');
  const [debtorId, setDebtorId] = useState('');

  React.useEffect(() => {
    if (activeCategories.length > 0 && !categoryId) setCategoryId(activeCategories[0].id);
    if (activeMembers.length > 0 && !payerMemberId) setPayerMemberId(activeMembers[0].id);
    if (activeMembers.length >= 2) {
      if (!creditorId) setCreditorId(activeMembers[0].id);
      if (!debtorId) setDebtorId(activeMembers[1].id);
    } else if (activeMembers.length === 1) {
      if (!creditorId) setCreditorId(activeMembers[0].id);
      if (!debtorId) setDebtorId(activeMembers[0].id);
    }
  }, [activeCategories, activeMembers, categoryId, payerMemberId, creditorId, debtorId]);

  // ESC key listener to close modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      showToast('Por favor, informe o valor do lançamento', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      if (expenseType === 'initial_credit') {
        const res = await recordSettlementAction({
          familyId: liveFamilyId || 'default',
          fromMemberId: debtorId || activeMembers[0].id,
          toMemberId: creditorId || activeMembers[0].id,
          amount: -parseFloat(amount),
          note: description || 'Crédito Inicial Pré-existente',
        });

        if (res.success) {
          showToast('✨ Crédito registrado com sucesso!');
          setTimeout(() => {
            setDescription('');
            setAmount('');
            if (onSuccess) onSuccess();
            onClose();
          }, 800);
        } else {
          showToast(res.error || 'Erro ao registrar crédito', 'error');
        }
      } else {
        const splits =
          splitMode === 'equal'
            ? activeMembers.map((m) => ({ memberId: m.id, percentage: 100 / activeMembers.length }))
            : [
                { memberId: activeMembers[0].id, percentage: customHusband },
                { memberId: activeMembers[1]?.id || activeMembers[0].id, percentage: customWife },
              ];

        const res = await addExpenseAction({
          familyId: liveFamilyId,
          payerMemberId: payerMemberId.startsWith('1') || payerMemberId.startsWith('2') ? '' : payerMemberId,
          categoryId: categoryId.startsWith('cat-') ? '' : categoryId,
          description: description.trim() || 'Despesa Geral',
          amount: parseFloat(amount),
          dueDate,
          expenseType,
          installmentsCount: expenseType === 'installment' ? installments : 1,
          splits,
          status: 'pending',
        });

        if (res.success) {
          showToast('✨ Lançamento salvo com sucesso!');
          setTimeout(() => {
            setDescription('');
            setAmount('');
            if (onSuccess) onSuccess();
            onClose();
          }, 800);
        } else {
          showToast(res.error || 'Erro ao salvar despesa', 'error');
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erro inesperado ao salvar', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const husbandName = activeMembers[0]?.displayName || 'Membro 1';
  const wifeName = activeMembers[1]?.displayName || 'Membro 2';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <Card
        variant="elevated"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg shadow-m3-3 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-outline-variant/20 dark:border-white/[0.06] pb-3">
          <div>
            <h3 className="font-semibold text-on-surface">Novo Lançamento</h3>
            <p className="text-xs text-on-surface-variant">Cadastre uma despesa ou ajuste de saldo inicial</p>
          </div>
          <Button variant="text" size="icon" onClick={onClose} aria-label="Fechar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Expense Type Selector with 4 tabs */}
          <div className="grid grid-cols-4 rounded-m3-md bg-surface-container dark:bg-[#141816] p-1 gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => setExpenseType('single')}
              className={`py-1.5 rounded-m3-sm font-medium transition-all ${
                expenseType === 'single'
                  ? 'bg-surface dark:bg-[#1E2421] shadow-m3-1 text-primary'
                  : 'text-on-surface-variant'
              }`}
            >
              Gasto Único
            </button>
            <button
              type="button"
              onClick={() => setExpenseType('installment')}
              className={`py-1.5 rounded-m3-sm font-medium transition-all flex items-center justify-center gap-0.5 ${
                expenseType === 'installment'
                  ? 'bg-surface dark:bg-[#1E2421] shadow-m3-1 text-primary'
                  : 'text-on-surface-variant'
              }`}
            >
              <Layers className="h-3 w-3" />
              Parcelado
            </button>
            <button
              type="button"
              onClick={() => setExpenseType('recurring')}
              className={`py-1.5 rounded-m3-sm font-medium transition-all flex items-center justify-center gap-0.5 ${
                expenseType === 'recurring'
                  ? 'bg-surface dark:bg-[#1E2421] shadow-m3-1 text-primary'
                  : 'text-on-surface-variant'
              }`}
            >
              <Repeat className="h-3 w-3" />
              Fixo
            </button>
            <button
              type="button"
              onClick={() => setExpenseType('initial_credit')}
              className={`py-1.5 rounded-m3-sm font-medium transition-all flex items-center justify-center gap-0.5 ${
                expenseType === 'initial_credit'
                  ? 'bg-surface dark:bg-[#1E2421] shadow-m3-1 text-primary'
                  : 'text-on-surface-variant'
              }`}
            >
              <ArrowRightLeft className="h-3 w-3" />
              Crédito
            </button>
          </div>

          {/* INITIAL CREDIT MODE */}
          {expenseType === 'initial_credit' ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-m3-md bg-primary-container/20 p-3 text-xs text-primary">
                💡 <strong>Crédito Inicial</strong>: Dá um saldo pré-existente a um membro sem precisar lançar despesas passadas.
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface-variant">Quem tem o crédito a favor?</label>
                <select
                  value={creditorId}
                  onChange={(e) => setCreditorId(e.target.value)}
                  className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] pl-3.5 pr-9 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none cursor-pointer"
                >
                  {activeMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface-variant">Quem deve esse valor?</label>
                <select
                  value={debtorId}
                  onChange={(e) => setDebtorId(e.target.value)}
                  className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] pl-3.5 pr-9 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none cursor-pointer"
                >
                  {activeMembers
                    .filter((m) => m.id !== creditorId)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.displayName}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface-variant">Valor do Crédito</label>
                <div className="mt-1">
                  <CurrencyInput
                    value={amount}
                    onChange={(val) => setAmount(val > 0 ? val.toString() : '')}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface-variant">Motivo / Descrição</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Saldo trazido do mês passado, viagem anterior"
                  className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          ) : (
            /* STANDARD EXPENSE MODES */
            <>
              {/* Description & Amount */}
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">Descrição da Conta</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Conta de Energia, Aluguel, Mercado"
                    className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] px-3.5 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-on-surface-variant">Valor</label>
                    <div className="mt-1">
                      <CurrencyInput
                        value={amount}
                        onChange={(val) => setAmount(val > 0 ? val.toString() : '')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-on-surface-variant">Vencimento</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] pl-3.5 pr-9 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Payer & Category Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">Quem Pagou?</label>
                  <select
                    value={payerMemberId}
                    onChange={(e) => setPayerMemberId(e.target.value)}
                    className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] pl-3.5 pr-9 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none cursor-pointer"
                  >
                    {activeMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">Categoria</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] pl-3.5 pr-9 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none cursor-pointer"
                  >
                    {activeCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Installment specific fields */}
              {expenseType === 'installment' && (
                <div className="rounded-m3-md bg-surface-container-high dark:bg-[#151A18] p-3 flex flex-col gap-2">
                  <label className="text-xs font-semibold text-on-surface">Número de Parcelas</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="2"
                      max="24"
                      value={installments}
                      onChange={(e) => setInstallments(parseInt(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <span className="text-sm font-bold text-primary min-w-8 text-right">{installments}x</span>
                  </div>
                  {amount && (
                    <p className="text-[11px] text-on-surface-variant">
                      {installments} parcelas mensais de aprox. R$ {(parseFloat(amount) / installments).toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              {/* Split settings */}
              <div className="border-t border-outline-variant/20 dark:border-white/[0.06] pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    Divisão da Conta
                  </label>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setSplitMode('equal')}
                      className={`px-2 py-0.5 rounded-m3-sm ${
                        splitMode === 'equal'
                          ? 'bg-primary-container text-primary font-semibold'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      50% / 50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitMode('custom')}
                      className={`px-2 py-0.5 rounded-m3-sm ${
                        splitMode === 'custom'
                          ? 'bg-primary-container text-primary font-semibold'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      Personalizado
                    </button>
                  </div>
                </div>

                {splitMode === 'custom' && (
                  <div className="flex flex-col gap-2 rounded-m3-md bg-surface-container dark:bg-[#141816] p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span>
                        {husbandName}: <strong>{customHusband}%</strong>
                      </span>
                      <span>
                        {wifeName}: <strong>{customWife}%</strong>
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={customHusband}
                      onChange={(e) => {
                        const h = parseInt(e.target.value);
                        setCustomHusband(h);
                        setCustomWife(100 - h);
                      }}
                      className="w-full accent-primary"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20 dark:border-white/[0.06]">
            <Button variant="text" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button variant="filled" size="md" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Salvar no Banco
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
};
