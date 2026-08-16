'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CurrencyInput } from '../ui/CurrencyInput';
import { Toast } from '../ui/Toast';
import { X, Check, Loader2, Calendar, Tag, User, CheckCircle2, Clock } from 'lucide-react';
import { updateExpenseAction } from '@/app/actions/expenses';
import { PAYMENT_METHODS, formatNotesWithPaymentMethod, extractPaymentMethod, PaymentMethod } from '@/services/payment-methods';

export interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: {
    id: string;
    description: string;
    amount: number;
    dueDate: string;
    status: 'paid' | 'pending';
    categoryId?: string;
    payerMemberId?: string;
    notes?: string;
  } | null;
  members?: Array<{ id: string; displayName: string; role: string }>;
  categories?: Array<{ id: string; name: string; color: string }>;
  currency?: string;
  onSuccess?: () => void;
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
  members = [],
  categories = [],
  currency = 'BRL',
  onSuccess,
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'paid' | 'pending'>('pending');
  const [categoryId, setCategoryId] = useState('');
  const [payerMemberId, setPayerMemberId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('c6_card');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error'; isVisible: boolean }>({
    message: '',
    isVisible: false,
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  useEffect(() => {
    if (expense) {
      setDescription(expense.description || '');
      setAmount(expense.amount ? expense.amount : 0);
      setDueDate(expense.dueDate ? expense.dueDate.split('T')[0] : new Date().toISOString().split('T')[0]);
      setStatus(expense.status || 'pending');

      const foundCatId =
        expense.categoryId ||
        categories.find((c) => c.name === (expense as any).categoryName)?.id ||
        categories[0]?.id ||
        '';
      setCategoryId(foundCatId);

      const foundPayerId =
        expense.payerMemberId ||
        members.find((m) => m.displayName === (expense as any).payerName)?.id ||
        members[0]?.id ||
        '';
      setPayerMemberId(foundPayerId);

      setPaymentMethod(extractPaymentMethod(expense.notes));
    }
  }, [expense, categories, members]);

  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !expense) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      showToast('Por favor, informe um valor válido', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateExpenseAction({
        expenseId: expense.id,
        description: description.trim() || 'Despesa',
        amount: amount,
        dueDate,
        status,
        categoryId: categoryId || undefined,
        payerMemberId: payerMemberId || undefined,
        notes: formatNotesWithPaymentMethod(paymentMethod),
      });

      if (res.success) {
        showToast('✨ Despesa atualizada com sucesso!');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 600);
      } else {
        showToast(res.error || 'Erro ao atualizar despesa', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erro inesperado', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <Card
        variant="elevated"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md shadow-m3-3 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-outline-variant/20 dark:border-white/[0.06] pb-3">
          <div>
            <h3 className="font-semibold text-on-surface">Editar Despesa</h3>
            <p className="text-xs text-on-surface-variant">Modifique os dados ou defina o status de pagamento</p>
          </div>
          <Button variant="text" size="icon" onClick={onClose} aria-label="Fechar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          {/* Status Toggle Buttons */}
          <div>
            <label className="font-semibold text-on-surface-variant mb-1.5 block">Status do Pagamento</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-m3-md border font-semibold transition-all ${
                  status === 'pending'
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/30'
                    : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <Clock className="h-4 w-4" />
                A Vencer (Pendente)
              </button>

              <button
                type="button"
                onClick={() => setStatus('paid')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-m3-md border font-semibold transition-all ${
                  status === 'paid'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/30'
                    : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                ✓ Pago (Liquidado)
              </button>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="font-semibold text-on-surface-variant mb-1.5 block">Meio de Pagamento</label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((pm) => {
                const isSelected = paymentMethod === pm.key;
                return (
                  <button
                    key={pm.key}
                    type="button"
                    onClick={() => setPaymentMethod(pm.key)}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-m3-md border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30'
                        : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <span>{pm.badgeLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="font-semibold text-on-surface-variant">Valor</label>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              currency={currency}
              required
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-semibold text-on-surface-variant">Descrição</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado, Aluguel"
              className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] px-3.5 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="font-semibold text-on-surface-variant flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Data de Vencimento
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] px-3.5 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
            />
          </div>

          {/* Category Selector */}
          {categories.length > 0 && (
            <div>
              <label className="font-semibold text-on-surface-variant flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                Categoria
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] px-3.5 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Payer Selector */}
          {members.length > 0 && (
            <div>
              <label className="font-semibold text-on-surface-variant flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                Quem Pagou / É Responsável
              </label>
              <select
                value={payerMemberId}
                onChange={(e) => setPayerMemberId(e.target.value)}
                className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] px-3.5 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
              >
                {members
                  .filter((m: any) => m.isActive !== false || m.id === expense?.payerMemberId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.displayName}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20 dark:border-white/[0.06]">
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
                  Salvar Alterações
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
