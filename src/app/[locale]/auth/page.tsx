'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Wallet, Mail, Lock, User, ArrowRight, Sparkles, Loader2, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Mock quick auth session / redirect for development
    setTimeout(() => {
      setIsLoading(false);
      router.push('/');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4 transition-colors duration-200">
      <Card variant="elevated" className="w-full max-w-md p-8 flex flex-col gap-6 shadow-m3-3">
        {/* Brand */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-m3-lg bg-primary text-white shadow-m3-2">
            <Wallet className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            {isSignUp ? 'Criar Conta no Family Wallet' : 'Entrar no Family Wallet'}
          </h1>
          <p className="text-xs text-on-surface-variant max-w-xs">
            {isSignUp
              ? 'Organize as finanças da sua família com simplicidade e inteligência'
              : 'Acesse o painel financeiro compartilhado da sua família'}
          </p>
        </div>

        {/* Toggle Form Type */}
        <div className="flex rounded-m3-md bg-surface-container dark:bg-[#141816] p-1 gap-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setMessage(null);
            }}
            className={`flex-1 py-2 rounded-m3-sm font-semibold transition-all ${
              !isSignUp ? 'bg-surface dark:bg-[#1E2421] shadow-m3-1 text-primary' : 'text-on-surface-variant'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setMessage(null);
            }}
            className={`flex-1 py-2 rounded-m3-sm font-semibold transition-all ${
              isSignUp ? 'bg-surface dark:bg-[#1E2421] shadow-m3-1 text-primary' : 'text-on-surface-variant'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          {isSignUp && (
            <div>
              <label className="font-semibold text-on-surface-variant">Seu Nome</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-on-surface-variant" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Lucas Mota"
                  className="w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] pl-9 pr-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="font-semibold text-on-surface-variant">E-mail</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-on-surface-variant" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] pl-9 pr-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-on-surface-variant">Senha</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-on-surface-variant" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] pl-9 pr-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {message && (
            <div className="rounded-m3-md bg-primary-container/30 p-3 text-xs text-primary font-medium">
              {message}
            </div>
          )}

          <Button variant="filled" size="md" type="submit" disabled={isLoading} className="mt-2 w-full gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'Criar Conta' : 'Acessar Painel'}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
