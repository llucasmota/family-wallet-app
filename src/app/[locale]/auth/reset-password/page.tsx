'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KeyRound, Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updatePasswordAction } from '@/app/actions/auth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem');
      return;
    }

    setIsLoading(true);

    try {
      const res = await updatePasswordAction(password);
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        setErrorMessage(res.error || 'Falha ao redefinir a senha');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ocorreu um erro ao atualizar a senha');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-4 transition-colors duration-200">
        <Card variant="elevated" className="w-full max-w-md p-8 flex flex-col items-center text-center gap-4 shadow-m3-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-m3-full bg-primary-container text-primary shadow-m3-1">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-on-surface">Senha Atualizada com Sucesso!</h2>
          <p className="text-xs text-on-surface-variant">
            Sua nova senha foi salva. Redirecionando você para o Family Wallet...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4 transition-colors duration-200">
      <Card variant="elevated" className="w-full max-w-md p-8 flex flex-col gap-6 shadow-m3-3">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-m3-lg bg-primary text-white shadow-m3-2">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            Cadastrar Nova Senha
          </h1>
          <p className="text-xs text-on-surface-variant max-w-xs">
            Digite e confirme sua nova senha abaixo para recuperar o acesso à sua conta.
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-m3-md bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="font-semibold text-on-surface-variant">Nova Senha</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-on-surface-variant" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="No mínimo 6 caracteres"
                className="w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] pl-9 pr-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-on-surface-variant">Confirmar Nova Senha</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-on-surface-variant" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] pl-9 pr-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <Button variant="filled" size="md" type="submit" disabled={isLoading} className="mt-2 w-full gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Salvar Nova Senha</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
