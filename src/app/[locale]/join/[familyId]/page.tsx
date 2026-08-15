'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Users, Check, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { getFamilyDataAction } from '@/app/actions/family';
import { joinFamilyAction } from '@/app/actions/auth';
import { AVATAR_PRESETS, SKIN_TONES, applySkinTone } from '@/components/ui/AvatarPresets';

export default function JoinFamilyPage() {
  const params = useParams();
  const router = useRouter();
  const familyId = params.familyId as string;

  const [displayName, setDisplayName] = useState('');
  const [avatarKey, setAvatarKey] = useState<string>('wife');
  const [role, setRole] = useState<'member' | 'child' | 'admin'>('member');
  const [familyName, setFamilyName] = useState('Família');
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await getFamilyDataAction();
        if (res.success && res.family) {
          setFamilyName(res.family.name);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [familyId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName) return;

    setIsJoining(true);
    setErrorMessage(null);

    try {
      const res = await joinFamilyAction({
        familyId,
        displayName,
        avatarKey,
        role,
      });

      if (res.success) {
        router.push('/');
      } else {
        setErrorMessage(res.error || 'Não foi possível ingressar na família');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro inesperado ao ingressar');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4 transition-colors duration-200">
      <Card variant="elevated" className="w-full max-w-lg p-8 flex flex-col gap-6 shadow-m3-3">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-m3-full bg-primary-container text-primary shadow-m3-1">
            <Users className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            Convite para {familyName}
          </h1>
          <p className="text-xs text-on-surface-variant max-w-sm">
            Você foi convidado(a) para participar do controle financeiro familiar. Escolha seu personagem e nome abaixo.
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-m3-md bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="flex flex-col gap-5 text-xs">
          {/* Preview */}
          <div className="flex items-center justify-center py-3 bg-surface-container/40 rounded-m3-lg gap-4">
            <Avatar
              name={displayName || 'Você'}
              avatarKey={avatarKey}
              size="xl"
            />
            <div className="flex flex-col">
              <span className="font-bold text-base text-on-surface">{displayName || 'Seu Nome'}</span>
              <span className="text-xs text-on-surface-variant">
                {AVATAR_PRESETS.find((p) => p.key === avatarKey)?.name}
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
              placeholder="Ex: Maria, João"
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

          <div>
            <label className="font-semibold text-on-surface-variant mb-2 block">
              Escolha seu Personagem IA
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
              {AVATAR_PRESETS.map((preset) => {
                const [currentBaseKey, currentToneKey] = (avatarKey || 'wife').split(':');
                const currentTone = SKIN_TONES.find((s) => s.key === currentToneKey);
                const isSelected = currentBaseKey === preset.key;
                const displayEmoji = preset.supportsSkinTone && currentTone?.modifier
                  ? applySkinTone(preset.baseEmoji, currentTone.modifier)
                  : preset.baseEmoji;

                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => {
                      const newKey = currentToneKey ? `${preset.key}:${currentToneKey}` : preset.key;
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

          <div>
            <label className="font-semibold text-on-surface-variant">Papel Familiar</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] pl-3.5 pr-9 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="member">Membro Familiar</option>
              <option value="admin">Administrador(a)</option>
              <option value="child">Dependente / Filho(a)</option>
            </select>
          </div>

          <Button variant="filled" size="md" type="submit" disabled={isJoining || !displayName} className="mt-2 w-full gap-2">
            {isJoining ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Entrar na Família</span>
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
