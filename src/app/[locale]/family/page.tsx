'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Settings,
  X,
  Copy,
  ExternalLink,
  MessageCircle,
  Pencil,
  Sparkles,
  Home,
  AlertCircle,
} from 'lucide-react';
import { AgentModal } from '@/components/agent/AgentModal';
import { QuickExpenseModal } from '@/components/dashboard/QuickExpenseModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Toast } from '@/components/ui/Toast';
import {
  getFamilyDataAction,
  recordSettlementAction,
  updateFamilySettingsAction,
  updateMemberProfileAction,
  updateFamilyCurrencyWithConversionAction,
  addMemberAction,
  deleteMemberAction,
} from '@/app/actions/family';
import { AVATAR_PRESETS, FAMILY_EMBLEMS, SKIN_TONES, getAdaptedEmoji } from '@/components/ui/AvatarPresets';

export default function FamilyPage() {
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
  const [isMemberEditOpen, setIsMemberEditOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettling, setIsSettling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error'; isVisible: boolean }>({
    message: '',
    isVisible: false,
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  // Group settings state
  const [groupName, setGroupName] = useState('');
  const [groupCurrency, setGroupCurrency] = useState('BRL');
  const [conversionMode, setConversionMode] = useState<'nominal' | 'convert_rate'>('nominal');
  const [exchangeRate, setExchangeRate] = useState('1');

  // Selected member to edit
  const [editingMember, setEditingMember] = useState<{
    id: string;
    displayName: string;
    avatarKey: string;
    color: string;
    role: 'admin' | 'member' | 'child';
  } | null>(null);

  // Credit adjustment form state
  const [creditAmount, setCreditAmount] = useState('');
  const [creditorId, setCreditorId] = useState('');
  const [debtorId, setDebtorId] = useState('');
  const [creditNote, setCreditNote] = useState('');

  const [family, setFamily] = useState<{
    id: string;
    name: string;
    currency: string;
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

  const loadFamily = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getFamilyDataAction();
      if (res.success && res.family) {
        setFamily(res.family as any);
        setGroupName(res.family.name);
        setGroupCurrency(res.family.currency || 'BRL');
        if (res.settlements) {
          setSettlements(res.settlements);
        }
        if (res.family.members && res.family.members.length > 0) {
          setCreditorId(res.family.members[0].id);
          if (res.family.members.length > 1) {
            setDebtorId(res.family.members[1].id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching family:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFamily();
  }, [loadFamily]);

  // Keyboard shortcut: ESC to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCreditModalOpen(false);
        setIsInviteModalOpen(false);
        setIsGroupSettingsOpen(false);
        setIsMemberEditOpen(false);
        setIsAgentOpen(false);
        setIsQuickAddOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getEffectiveInviteUrl = useCallback(() => {
    if (typeof window === 'undefined') return '';
    if (family?.id) return `${window.location.origin}/join/${family.id}`;
    return `${window.location.origin}/join`;
  }, [family?.id]);

  const handleCopyInvite = () => {
    const url = getEffectiveInviteUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    showToast('✨ Link de convite copiado com sucesso para a área de transferência!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const url = getEffectiveInviteUrl();
    if (!url) return;
    const message = encodeURIComponent(
      `Oi! Entre no Family Wallet da nossa família (${family?.name || 'Família'}) para acompanharmos nossos gastos juntos:\n${url}`
    );
    navigator.clipboard.writeText(url);
    showToast('✨ Link copiado! Abrindo WhatsApp...');
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
  };

  const handleNativeShare = async () => {
    const url = getEffectiveInviteUrl();
    if (navigator.share && url) {
      try {
        await navigator.share({
          title: `Convite para ${family?.name || 'Family Wallet'}`,
          text: `Entre no Family Wallet da nossa família para acompanharmos nossos gastos juntos!`,
          url: url,
        });
        showToast('✨ Convite compartilhado com sucesso!');
      } catch {
        handleCopyInvite();
      }
    } else {
      handleCopyInvite();
    }
  };

  const handleSaveGroupSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family || !groupName.trim()) return;

    setIsSaving(true);
    try {
      if (groupCurrency !== family.currency) {
        await updateFamilyCurrencyWithConversionAction({
          familyId: family.id,
          newCurrency: groupCurrency,
          mode: conversionMode,
          exchangeRate: conversionMode === 'convert_rate' ? parseFloat(exchangeRate) || 1 : 1,
        });
      }

      await updateFamilySettingsAction({
        familyId: family.id,
        name: groupName.trim(),
        currency: groupCurrency,
      });

      setIsGroupSettingsOpen(false);
      await loadFamily();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenMemberEdit = (member: any) => {
    setEditingMember({ ...member });
    setIsMemberEditOpen(true);
  };

  const handleOpenAddMember = () => {
    setEditingMember({
      id: '',
      displayName: '',
      avatarKey: 'husband',
      color: '#1E6B52',
      role: (family?.members.length || 0) === 0 ? 'admin' : 'member',
    });
    setIsMemberEditOpen(true);
  };

  const handleSaveMemberProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !family) return;

    setIsSaving(true);
    try {
      if (editingMember.id) {
        // Optimistic UI update
        const updatedMembers = family.members.map((m) =>
          m.id === editingMember.id
            ? {
                ...m,
                displayName: editingMember.displayName,
                avatarKey: editingMember.avatarKey,
                color: editingMember.color,
                role: editingMember.role,
              }
            : m
        );
        setFamily({ ...family, members: updatedMembers });

        await updateMemberProfileAction({
          memberId: editingMember.id,
          displayName: editingMember.displayName,
          avatarKey: editingMember.avatarKey,
          color: editingMember.color,
          role: editingMember.role,
        });
        showToast('✨ Perfil atualizado com sucesso!');
      } else {
        await addMemberAction({
          familyId: family.id,
          displayName: editingMember.displayName,
          avatarKey: editingMember.avatarKey,
          color: editingMember.color,
          role: editingMember.role,
        });
        showToast('✨ Novo membro adicionado com sucesso!');
      }
      setIsMemberEditOpen(false);
      await loadFamily();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar membro', 'error');
    } finally {
      setIsSaving(false);
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
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: family?.currency || 'BRL' }).format(
      val
    );

  const M3_PALETTE = [
    '#1E6B52', // Emerald / Pine
    '#3D6473', // Slate Blue
    '#D97706', // Warm Amber
    '#E11D48', // Rose Berry
    '#7C3AED', // Violet
    '#0284C7', // Ocean
    '#059669', // Mint
    '#4F46E5', // Indigo
    '#CA8A04', // Gold
    '#4B5563', // Charcoal
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface transition-colors duration-200">
      <Navbar
        onOpenAgent={() => setIsAgentOpen(true)}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-m3-lg bg-primary/10 text-primary border border-primary/20 shadow-m3-1">
              <Home className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
                  {family?.name || 'Grupo Familiar'}
                </h1>
                <button
                  onClick={() => setIsGroupSettingsOpen(true)}
                  title="Configurar Grupo"
                  className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant">
                Membros cadastrados, avatares inteligentes e acerto de contas
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="tonal"
              size="sm"
              onClick={handleOpenAddMember}
              className="gap-1.5 text-xs"
            >
              <Plus className="h-4 w-4" />
              Adicionar Membro
            </Button>
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
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-on-surface flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Membros da Família ({family?.members.length || 0})
            </h2>
            <span className="text-xs text-on-surface-variant">Clique em Editar para personalizar avatar</span>
          </div>

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
          ) : !family?.members || family.members.length === 0 ? (
            <Card variant="elevated" className="flex flex-col items-center justify-center py-10 gap-3 text-center shadow-m3-1">
              <Avatar name="Você" avatarKey="husband" size="xl" />
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-on-surface text-base">Nenhum membro cadastrado ainda</h3>
                <p className="text-xs text-on-surface-variant max-w-sm">
                  Crie o seu perfil de administrador para escolher seu avatar e gerenciar as despesas com a sua família.
                </p>
              </div>
              <Button variant="filled" size="md" onClick={handleOpenAddMember} className="gap-2 mt-2">
                <Plus className="h-4 w-4" />
                <span>Criar Meu Perfil de Administrador</span>
              </Button>
            </Card>
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
                        Avatar: {AVATAR_PRESETS.find((p) => p.key === member.avatarKey.split(':')[0])?.name || 'Personalizado'}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="tonal"
                    size="sm"
                    onClick={() => handleOpenMemberEdit(member)}
                    className="gap-1.5 text-xs h-8"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Group Settings Modal */}
      {isGroupSettingsOpen && (
        <div
          onClick={() => setIsGroupSettingsOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <Card
            variant="elevated"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md shadow-m3-3 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 dark:border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-on-surface">Configurações do Grupo</h3>
              </div>
              <Button variant="text" size="icon" onClick={() => setIsGroupSettingsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveGroupSettings} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="font-semibold text-on-surface-variant">Nome do Grupo / Família</label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ex: Família Mota, Nosso Lar"
                  className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] px-3.5 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-on-surface-variant">Moeda Padrão</label>
                <select
                  value={groupCurrency}
                  onChange={(e) => setGroupCurrency(e.target.value)}
                  className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] pl-3.5 pr-9 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="BRL">Real Brasileiro (R$ - BRL)</option>
                  <option value="USD">Dólar Americano ($ - USD)</option>
                  <option value="EUR">Euro (€ - EUR)</option>
                </select>
              </div>

              {/* Currency Change Conversion Mode Selection */}
              {groupCurrency !== (family?.currency || 'BRL') && (
                <div className="rounded-m3-md border border-amber-500/30 bg-amber-500/10 p-3.5 flex flex-col gap-2.5 text-xs text-on-surface">
                  <div className="flex items-center gap-1.5 font-bold text-amber-500">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Como tratar os lançamentos anteriores?</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="convMode"
                        checked={conversionMode === 'nominal'}
                        onChange={() => setConversionMode('nominal')}
                        className="mt-0.5 accent-primary cursor-pointer"
                      />
                      <div>
                        <strong className="block font-semibold">Troca Nominal Simples</strong>
                        <span className="text-[11px] text-on-surface-variant">
                          Manter os valores numéricos como estão (Ex: R$ 100,00 se torna {groupCurrency === 'USD' ? '$ 100,00' : '€ 100,00'}).
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="convMode"
                        checked={conversionMode === 'convert_rate'}
                        onChange={() => setConversionMode('convert_rate')}
                        className="mt-0.5 accent-primary cursor-pointer"
                      />
                      <div>
                        <strong className="block font-semibold">Converter pela Cotação Cambial</strong>
                        <span className="text-[11px] text-on-surface-variant">
                          Recalcular todo o histórico com a taxa de câmbio informada.
                        </span>
                      </div>
                    </label>
                  </div>

                  {conversionMode === 'convert_rate' && (
                    <div className="mt-1 pt-2 border-t border-amber-500/20">
                      <label className="font-semibold text-on-surface-variant block mb-1">
                        Taxa de Câmbio / Multiplicador
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        required
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(e.target.value)}
                        placeholder="Ex: 0.18 (de BRL para USD) ou 5.60 (de USD para BRL)"
                        className="w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20 dark:border-white/[0.06]">
                <Button
                  variant="text"
                  size="sm"
                  type="button"
                  onClick={() => setIsGroupSettingsOpen(false)}
                >
                  Cancelar
                </Button>
                <Button variant="filled" size="md" type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Configurações'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Member Profile Edit Modal with AI Character Gallery */}
      {isMemberEditOpen && editingMember && (
        <div
          onClick={() => setIsMemberEditOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <Card
            variant="elevated"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg shadow-m3-3 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 dark:border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-on-surface">Editar Perfil do Membro</h3>
                  <p className="text-xs text-on-surface-variant">Escolha um avatar de personagem IA e personalize</p>
                </div>
              </div>
              <Button variant="text" size="icon" onClick={() => setIsMemberEditOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveMemberProfile} className="flex flex-col gap-4 text-xs">
              {/* Preview */}
              <div className="flex items-center justify-center py-3 bg-surface-container/40 rounded-m3-lg gap-4">
                <Avatar
                  name={editingMember.displayName}
                  avatarKey={editingMember.avatarKey}
                  color={editingMember.color}
                  role={editingMember.role}
                  size="xl"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-base text-on-surface">{editingMember.displayName || 'Nome'}</span>
                  <span className="text-xs text-on-surface-variant">
                    {AVATAR_PRESETS.find((p) => p.key === editingMember.avatarKey.split(':')[0])?.name}
                  </span>
                  <span className="text-[11px] text-primary mt-0.5">
                    {editingMember.role === 'admin' ? 'Administrador Familiar' : 'Membro'}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-on-surface-variant">Nome de Exibição</label>
                <input
                  type="text"
                  required
                  value={editingMember.displayName}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, displayName: e.target.value })
                  }
                  className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] px-3.5 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              {/* Skin Tone Selector */}
              <div>
                <label className="font-semibold text-on-surface-variant mb-1.5 block">
                  Tom de Pele (O avatar se adapta automaticamente)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SKIN_TONES.map((tone) => {
                    const [baseKey, currentToneKey] = (editingMember.avatarKey || 'husband').split(':');
                    const isSelected = (currentToneKey || 'default') === tone.key;
                    return (
                      <button
                        key={tone.key}
                        type="button"
                        onClick={() => {
                          const newKey = tone.key === 'default' ? baseKey : `${baseKey}:${tone.key}`;
                          setEditingMember({ ...editingMember, avatarKey: newKey });
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-m3-md border text-xs font-medium transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/40'
                            : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container'
                        }`}
                      >
                        <span className="text-sm">{tone.emoji}</span>
                        <span className="text-[11px]">{tone.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Avatar Gallery */}
              <div>
                <label className="font-semibold text-on-surface-variant mb-2 block">
                  Galeria de Personagens IA
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                  {AVATAR_PRESETS.map((preset) => {
                    const [currentBaseKey, currentToneKey] = (editingMember.avatarKey || 'husband').split(':');
                    const isSelected = currentBaseKey === preset.key;
                    const displayEmoji = getAdaptedEmoji(preset.key, currentToneKey || 'default');

                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => {
                          const newKey = currentToneKey && currentToneKey !== 'default' ? `${preset.key}:${currentToneKey}` : preset.key;
                          setEditingMember({
                            ...editingMember,
                            avatarKey: newKey,
                            color: preset.bgColor,
                          });
                        }}
                        className={`flex flex-col items-center p-2 rounded-m3-md border transition-all text-center gap-1 ${
                          isSelected
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/40 shadow-m3-1'
                            : 'border-outline-variant/30 hover:bg-surface-container'
                        }`}
                      >
                        <span className="text-2xl">{displayEmoji}</span>
                        <span className="text-[10px] font-semibold text-on-surface truncate w-full">
                          {preset.name.split('/')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="font-semibold text-on-surface-variant mb-2 block">Cor de Identificação</label>
                <div className="flex flex-wrap gap-2">
                  {M3_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditingMember({ ...editingMember, color })}
                      className={`h-7 w-7 rounded-full flex items-center justify-center transition-transform ${
                        editingMember.color === color ? 'scale-125 ring-2 ring-primary' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {editingMember.color === color && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-on-surface-variant">Papel Familiar</label>
                <select
                  value={editingMember.role}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, role: e.target.value as any })
                  }
                  className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] pl-3.5 pr-9 py-2 text-xs text-on-surface focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="admin">Administrador (Controle Total)</option>
                  <option value="member">Membro (Lançamentos e Visualização)</option>
                  <option value="child">Dependente / Filho</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20 dark:border-white/[0.06]">
                <Button
                  variant="text"
                  size="sm"
                  type="button"
                  onClick={() => setIsMemberEditOpen(false)}
                >
                  Cancelar
                </Button>
                <Button variant="filled" size="md" type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

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
                  value={getEffectiveInviteUrl()}
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
                  href={getEffectiveInviteUrl() || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
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
                <label className="font-semibold text-on-surface-variant">Valor do Crédito</label>
                <div className="mt-1">
                  <CurrencyInput
                    value={creditAmount}
                    onChange={(val) => setCreditAmount(val > 0 ? val.toString() : '')}
                    currency={family?.currency || 'BRL'}
                  />
                </div>
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

      {/* Toast Notification */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
