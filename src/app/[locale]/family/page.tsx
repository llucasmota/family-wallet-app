'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import {
  Users,
  Share2,
  ArrowRightLeft,
  Check,
  Loader2,
  Plus,
  Sparkles,
  X,
  Copy,
  ExternalLink,
  MessageCircle,
  QrCode,
} from 'lucide-react';
import { AgentModal } from '@/components/agent/AgentModal';
import { QuickExpenseModal } from '@/components/dashboard/QuickExpenseModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { getFamilyDataAction, recordSettlementAction } from '@/app/actions/family';

export default function FamilyPage() {
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettling, setIsSettling] = useState(false);

  // Credit adjustment form state
  const [creditAmount, setCreditAmount] = useState('');
  const [creditorId, setCreditorId] = useState('');
  const [debtorId, setDebtorId] = useState('');
  const [creditNote, setCreditNote] = useState('');

  const [family, setFamily] = useState<{
    id: string;
    name: string;
    members: Array<{
      id: string;
      displayName: string;
      role: 'admin' | 'member' | 'child';
      avatarKey: string;
      color: string;
    }>;
  } | null>(null);

  const [settlements, setSettlements] = useState<
    Array<{
      fromMemberId: string;
      fromName: string;
      fromAvatarKey: string;
      toMemberId: string;
      toName: string;
      toAvatarKey: string;
      amount: number;
    }>
  >([]);

  const loadFamily = async () => {
    try {
      const res = await getFamilyDataAction();
      if (res.success && res.family) {
        setFamily(res.family as any);
        setSettlements(res.settlements || []);
        if (res.family.members.length >= 2) {
          setCreditorId(res.family.members[0].id);
          setDebtorId(res.family.members[1].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFamily();
  }, []);

  // ESC key listener for Modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCreditModalOpen(false);
        setIsInviteModalOpen(false);
        setIsAgentOpen(false);
        setIsQuickAddOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const inviteUrl =
    typeof window !== 'undefined' && family ? `${window.location.origin}/join/${family.id}` : '';

  const handleCopyInvite = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    if (!inviteUrl || !family) return;
    const message = encodeURIComponent(
      `Oi! Entre no Family Wallet da nossa família (${family.name}) para acompanharmos nossos gastos juntos:\n${inviteUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share && inviteUrl && family) {
      try {
        await navigator.share({
          title: `Convite para ${family.name}`,
          text: `Entre no Family Wallet da nossa família para acompanharmos nossos gastos juntos!`,
          url: inviteUrl,
        });
      } catch {}
    } else {
      handleCopyInvite();
    }
  };

  const handleSettleDebt = async (debt: (typeof settlements)[0]) => {
    if (!family) return;
    setIsSettling(true);

    try {
      await recordSettlementAction({
        familyId: family.id,
        fromMemberId: debt.fromMemberId,
        toMemberId: debt.toMemberId,
        amount: debt.amount,
      });
      await loadFamily();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSettling(false);
    }
  };

  const handleSaveInitialCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family || !creditAmount || !creditorId || !debtorId) return;

    setIsSettling(true);
    try {
      await recordSettlementAction({
        familyId: family.id,
        fromMemberId: debtorId,
        toMemberId: creditorId,
        amount: -parseFloat(creditAmount),
        note: creditNote || 'Saldo/Crédito Inicial Pré-existente',
      });
      setIsCreditModalOpen(false);
      setCreditAmount('');
      setCreditNote('');
      await loadFamily();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSettling(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="min-h-screen flex flex-col bg-surface transition-colors duration-200">
      <Navbar
        onOpenAgent={() => setIsAgentOpen(true)}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
              {family?.name || 'Grupo Familiar'}
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Membros cadastrados, papéis de avatares e acertos de contas em tempo real
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              size="sm"
              onClick={() => setIsCreditModalOpen(true)}
              className="gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Lançar Crédito Inicial
            </Button>
            <Button
              variant="filled"
              size="sm"
              onClick={() => setIsInviteModalOpen(true)}
              className="gap-2 text-xs"
            >
              <Share2 className="h-4 w-4" />
              Convidar Familiar
            </Button>
          </div>
        </div>

        {/* Settlement Card: Dynamic Debt Matrix */}
        {isLoading ? (
          <Card variant="elevated" className="h-28 flex flex-col justify-center gap-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex flex-col gap-1.5 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>
            </div>
          </Card>
        ) : (
          <Card variant="elevated" className="bg-primary-container/20 dark:bg-[#1A221E] p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-m3-full bg-primary text-white shadow-m3-1">
                  <ArrowRightLeft className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">Acerto de Contas do Mês</h3>
                  <p className="text-xs text-on-surface-variant">
                    Calculado dinamicamente com base nas despesas, splits e saldos pré-existentes
                  </p>
                </div>
              </div>

              {settlements.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {settlements.map((debt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-m3-md bg-surface dark:bg-[#141816] p-3 shadow-m3-1 text-xs"
                    >
                      <Avatar name={debt.fromName} avatarKey={debt.fromAvatarKey} size="sm" />
                      <div>
                        <span className="font-semibold text-on-surface">{debt.fromName}</span> deve{' '}
                        <strong className="text-primary font-bold text-sm">
                          {formatCurrency(debt.amount)}
                        </strong>{' '}
                        para <span className="font-semibold text-on-surface">{debt.toName}</span>
                      </div>
                      <Button
                        variant="filled"
                        size="sm"
                        onClick={() => handleSettleDebt(debt)}
                        disabled={isSettling}
                        className="ml-2 h-7 px-2.5 text-[11px]"
                      >
                        {isSettling ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Liquidar'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-m3-md bg-surface dark:bg-[#141816] px-4 py-2 text-xs font-semibold text-primary shadow-m3-1">
                  🎉 Tudo acertado! Nenhuma dívida pendente entre os membros.
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Members List */}
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-on-surface flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Membros da Família ({family?.members.length || 0})
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card variant="elevated" className="h-24 flex items-center gap-3 p-5">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex flex-col gap-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </Card>
              <Card variant="elevated" className="h-24 flex items-center gap-3 p-5">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex flex-col gap-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {family?.members.map((member) => (
                <Card key={member.id} variant="elevated" className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3.5">
                    <Avatar
                      name={member.displayName}
                      role={member.role}
                      avatarKey={member.avatarKey}
                      color={member.color}
                      size="lg"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-on-surface">{member.displayName}</span>
                        <Badge variant="paid">
                          {member.role === 'admin' ? 'Administrador' : 'Membro'}
                        </Badge>
                      </div>
                      <span className="text-xs text-on-surface-variant mt-0.5">
                        Papel: {member.avatarKey === 'husband' ? 'Esposo' : member.avatarKey === 'wife' ? 'Esposa' : 'Familiar'}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Dedicated Invite Modal */}
      {isInviteModalOpen && (
        <div
          onClick={() => setIsInviteModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <Card
            variant="elevated"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md shadow-m3-3 flex flex-col gap-5"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 dark:border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-m3-full bg-primary-container text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-on-surface">Convidar Familiar</h3>
                  <p className="text-xs text-on-surface-variant">Compartilhe o acesso ao Family Wallet</p>
                </div>
              </div>
              <Button variant="text" size="icon" onClick={() => setIsInviteModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <p className="text-on-surface-variant leading-relaxed">
                Envie o link abaixo para seu cônjuge ou familiar. Ao acessar, a pessoa escolherá seu nome e avatar para entrar no grupo <strong>{family?.name}</strong>:
              </p>

              {/* Link Box with Copy Button */}
              <div className="flex items-center gap-2 rounded-m3-md border border-outline-variant/40 bg-surface-container dark:bg-[#141816] p-2.5">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="w-full bg-transparent text-xs text-on-surface font-mono focus:outline-none select-all truncate"
                />
                <Button
                  variant="filled"
                  size="sm"
                  onClick={handleCopyInvite}
                  className="gap-1.5 shrink-0 h-8 px-3 text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-white" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>

              {/* Quick Share Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Button
                  variant="tonal"
                  size="md"
                  onClick={handleShareWhatsApp}
                  className="gap-2 text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                >
                  <MessageCircle className="h-4 w-4" />
                  Enviar no WhatsApp
                </Button>

                <Button
                  variant="outlined"
                  size="md"
                  onClick={handleNativeShare}
                  className="gap-2 text-xs"
                >
                  <Share2 className="h-4 w-4" />
                  Compartilhar
                </Button>
              </div>

              {/* Preview Link */}
              <div className="border-t border-outline-variant/20 dark:border-white/[0.06] pt-3 text-center">
                <a
                  href={`/join/${family?.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Visualizar tela de convite
                </a>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Starting Credit Balance Modal */}
      {isCreditModalOpen && (
        <div
          onClick={() => setIsCreditModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <Card
            variant="elevated"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md shadow-m3-3 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 dark:border-white/[0.06] pb-3">
              <div>
                <h3 className="font-semibold text-on-surface">Lançar Crédito Inicial</h3>
                <p className="text-xs text-on-surface-variant">
                  Defina um saldo pré-existente sem precisar lançar despesas passadas
                </p>
              </div>
              <Button variant="text" size="icon" onClick={() => setIsCreditModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveInitialCredit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-on-surface-variant">Quem tem o crédito a favor?</label>
                <select
                  value={creditorId}
                  onChange={(e) => setCreditorId(e.target.value)}
                  className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] pl-3.5 pr-9 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none cursor-pointer"
                >
                  {family?.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-on-surface-variant">Quem deve esse valor?</label>
                <select
                  value={debtorId}
                  onChange={(e) => setDebtorId(e.target.value)}
                  className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] pl-3.5 pr-9 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none cursor-pointer"
                >
                  {family?.members
                    .filter((m) => m.id !== creditorId)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.displayName}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-on-surface-variant">Valor do Crédito (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="Ex: 500.00"
                  className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-on-surface-variant">Motivo / Descrição</label>
                <input
                  type="text"
                  value={creditNote}
                  onChange={(e) => setCreditNote(e.target.value)}
                  placeholder="Ex: Saldo trazido do mês passado, viagem anterior"
                  className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20 dark:border-white/[0.06]">
                <Button
                  variant="text"
                  size="sm"
                  type="button"
                  onClick={() => setIsCreditModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button variant="filled" size="md" type="submit" disabled={isSettling}>
                  {isSettling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Crédito'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <AgentModal
        isOpen={isAgentOpen}
        onClose={() => setIsAgentOpen(false)}
        onConfirmDraft={() => {}}
      />

      <QuickExpenseModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        familyId={family?.id}
        members={family?.members as any}
        onSuccess={loadFamily}
      />
    </div>
  );
}
