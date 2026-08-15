'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Users, Heart, Baby, Shield, Check, Loader2, AlertCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { getFamilyDataAction } from '@/app/actions/family';
import { joinFamilyAction } from '@/app/actions/auth';

export default function JoinFamilyPage() {
  const params = useParams();
  const router = useRouter();
  const familyId = params.familyId as string;

  const [displayName, setDisplayName] = useState('');
  const [avatarKey, setAvatarKey] = useState<'wife' | 'husband' | 'child' | 'custom'>('wife');
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

  const avatarOptions = [
    { key: 'wife', label: 'Esposa', icon: <Heart className="h-4 w-4" />, color: '#3D6473' },
    { key: 'husband', label: 'Esposo', icon: <Shield className="h-4 w-4" />, color: '#1E6B52' },
    { key: 'child', label: 'Filho(a)', icon: <Baby className="h-4 w-4" />, color: '#FF9800' },
  ];

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
            Você foi convidado(a) para participar do controle financeiro da sua família. Escolha seu avatar e nome de exibição abaixo.
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-m3-md bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="flex flex-col gap-5 text-xs">
          <div>
            <label className="font-semibold text-on-surface-variant">Seu Nome de Exibição</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex: Ana Mota"
              className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] px-3.5 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
            />
          </div>

          {/* Avatar Role Picker */}
          <div>
            <label className="font-semibold text-on-surface-variant mb-2 block">
              Escolha seu Papel / Avatar
            </label>
            <div className="grid grid-cols-3 gap-3">
              {avatarOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setAvatarKey(opt.key as any);
                    if (opt.key === 'child') setRole('child');
                    else setRole('member');
                  }}
                  className={`flex flex-col items-center justify-center gap-2 rounded-m3-lg p-3.5 transition-all border ${
                    avatarKey === opt.key
                      ? 'border-primary bg-primary-container/30 text-primary shadow-m3-1'
                      : 'border-outline-variant/30 bg-surface-container dark:bg-[#141816] text-on-surface-variant hover:border-outline-variant'
                  }`}
                >
                  <Avatar
                    name={displayName || opt.label}
                    avatarKey={opt.key}
                    color={opt.color}
                    size="md"
                  />
                  <span className="font-bold text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Button variant="filled" size="md" type="submit" disabled={isJoining || !displayName} className="mt-3 w-full gap-2">
            {isJoining ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Entrar no Grupo Familiar</span>
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
