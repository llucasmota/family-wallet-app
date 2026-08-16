'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Users, Check, Loader2, AlertCircle, Sparkles, Mail, Lock, LogOut } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { getFamilyDataAction } from '@/app/actions/family';
import { signUpAndJoinFamilyAction, signOutAction } from '@/app/actions/auth';
import { AVATAR_PRESETS, SKIN_TONES, getAdaptedEmoji } from '@/components/ui/AvatarPresets';

export default function JoinFamilyPage() {
  const params = useParams();
  const router = useRouter();
  const familyId = params.familyId as string;

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarKey, setAvatarKey] = useState<string>('wife');
  const [familyName, setFamilyName] = useState('Família');
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await getFamilyDataAction();
        if (res.success && res.family) {
          setFamilyName(res.family.name);
          if (res.currentUserEmail) {
            setCurrentUserEmail(res.currentUserEmail);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [familyId]);

  const handleSignOutAndReload = async () => {
    await signOutAction();
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !email || !password) return;

    if (password.length < 6) {
      setErrorMessage('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setIsJoining(true);
    setErrorMessage(null);

    try {
      const res = await signUpAndJoinFamilyAction({
        familyId,
        email,
        password,
        displayName,
        avatarKey,
        role: 'member', // Strictly member (only group creator is admin)
      });

      if (res.success) {
        router.push('/');
      } else {
        setErrorMessage((res as any).error || 'Não foi possível concluir seu cadastro');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro inesperado ao criar conta');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4 transition-colors duration-200 py-10">
      <Card variant="elevated" className="w-full max-w-lg p-6 sm:p-8 flex flex-col gap-6 shadow-m3-3">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-m3-full bg-primary-container text-primary shadow-m3-1">
            <Users className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            Convite para {familyName}
          </h1>
          <p className="text-xs text-on-surface-variant max-w-sm">
            Você foi convidado(a) para participar da gestão financeira familiar. Crie sua conta e personalize seu personagem abaixo.
          </p>
        </div>

        {/* Warning if a user is already logged in on this browser (e.g. Lucas's session) */}
        {currentUserEmail && (
          <div className="flex flex-col gap-2 rounded-m3-md bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-on-surface">
            <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Sessão ativa detectada: {currentUserEmail}</span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Se este convite é para outra pessoa (como sua esposa), clique abaixo para sair antes de criar a nova conta.
            </p>
            <Button
              variant="outlined"
              size="sm"
              type="button"
              onClick={handleSignOutAndReload}
              className="mt-1 self-start gap-1 text-xs text-amber-600 border-amber-500/40"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair desta conta para cadastrar nova
            </Button>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-m3-md bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="flex flex-col gap-5 text-xs">
          {/* Section 1: Member Profile */}
          <div className="flex flex-col gap-4 border-b border-outline-variant/20 dark:border-white/[0.06] pb-5">
            <h3 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              1. Seu Perfil Familiar
            </h3>

            {/* Avatar Preview */}
            <div className="flex items-center justify-center py-3 bg-surface-container/40 rounded-m3-lg gap-4">
              <Avatar
                name={displayName || 'Você'}
                avatarKey={avatarKey}
                size="xl"
              />
              <div className="flex flex-col">
                <span className="font-bold text-base text-on-surface">{displayName || 'Seu Nome'}</span>
                <span className="text-xs text-on-surface-variant">
                  {AVATAR_PRESETS.find((p) => p.key === avatarKey.split(':')[0])?.name || 'Membro'}
                </span>
                <span className="text-[10px] text-primary font-semibold mt-0.5">
                  Papel: Membro Familiar
                </span>
              </div>
            </div>

            <div>
              <label className="font-semibold text-on-surface-variant">Seu Nome de Exibição</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Maria, Bruna, João"
                className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] px-3.5 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </div>

            {/* Skin Tone Selector */}
            <div>
              <label className="font-semibold text-on-surface-variant mb-1.5 block">
                Tom de Pele
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SKIN_TONES.map((tone) => {
                  const [baseKey, currentToneKey] = (avatarKey || 'wife').split(':');
                  const isSelected = (currentToneKey || 'default') === tone.key;
                  return (
                    <button
                      key={tone.key}
                      type="button"
                      onClick={() => {
                        const newKey = tone.key === 'default' ? baseKey : `${baseKey}:${tone.key}`;
                        setAvatarKey(newKey);
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

            {/* Avatar Selector */}
            <div>
              <label className="font-semibold text-on-surface-variant mb-2 block">
                Escolha seu Personagem IA
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1 border border-outline-variant/20 rounded-m3-md bg-surface-container/20">
                {AVATAR_PRESETS.map((preset) => {
                  const [currentBaseKey, currentToneKey] = (avatarKey || 'wife').split(':');
                  const isSelected = currentBaseKey === preset.key;
                  const displayEmoji = getAdaptedEmoji(preset.key, currentToneKey || 'default');

                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => {
                        const newKey = currentToneKey && currentToneKey !== 'default' ? `${preset.key}:${currentToneKey}` : preset.key;
                        setAvatarKey(newKey);
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
          </div>

          {/* Section 2: Account Credentials */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-primary" />
              2. Crie seus Dados de Acesso
            </h3>

            <div>
              <label className="font-semibold text-on-surface-variant flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-primary" />
                Seu E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] px-3.5 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-on-surface-variant flex items-center gap-1">
                <Lock className="h-3.5 w-3.5 text-primary" />
                Crie sua Senha
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] px-3.5 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <Button
            variant="filled"
            size="md"
            type="submit"
            disabled={isJoining || !displayName || !email || !password}
            className="mt-3 w-full gap-2 text-sm h-11"
          >
            {isJoining ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Criando conta e ingressando...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Concluir Cadastro e Entrar no Grupo</span>
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
