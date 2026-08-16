'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Receipt, Plus, Users, Tag } from 'lucide-react';

export interface MobileBottomNavProps {
  onOpenQuickAdd: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenQuickAdd }) => {
  const pathname = usePathname();

  const isHome = pathname === '/' || pathname === '/en';
  const isExpenses = pathname.includes('/expenses');
  const isFamily = pathname.includes('/family');
  const isCategories = pathname.includes('/categories');

  return (
    <nav
      aria-label="Navegação Principal Mobile"
      className="fixed bottom-0 inset-x-0 z-50 block md:hidden max-w-lg mx-auto p-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-all animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-center justify-around px-2 py-1.5 rounded-2xl border border-outline-variant/40 bg-surface/95 dark:bg-[#141816]/95 backdrop-blur-2xl shadow-2xl text-on-surface">
        {/* 1. Visão Geral */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            isHome
              ? 'text-primary font-bold scale-105'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <div className={`flex items-center justify-center p-1 rounded-lg ${isHome ? 'bg-primary/10' : ''}`}>
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <span className="text-[10px] tracking-tight">Início</span>
        </Link>

        {/* 2. Despesas */}
        <Link
          href="/expenses"
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            isExpenses
              ? 'text-primary font-bold scale-105'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <div className={`flex items-center justify-center p-1 rounded-lg ${isExpenses ? 'bg-primary/10' : ''}`}>
            <Receipt className="h-5 w-5" />
          </div>
          <span className="text-[10px] tracking-tight">Despesas</span>
        </Link>

        {/* 3. Central Floating Action Button (Novo Lançamento) */}
        <button
          type="button"
          onClick={onOpenQuickAdd}
          aria-label="Adicionar Nova Despesa"
          className="flex flex-col items-center justify-center -mt-5 transition-transform active:scale-90"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 border-2 border-surface dark:border-[#121614] hover:bg-primary/90 transition-colors">
            <Plus className="h-6 w-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-primary mt-0.5">Novo</span>
        </button>

        {/* 4. Família */}
        <Link
          href="/family"
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            isFamily
              ? 'text-primary font-bold scale-105'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <div className={`flex items-center justify-center p-1 rounded-lg ${isFamily ? 'bg-primary/10' : ''}`}>
            <Users className="h-5 w-5" />
          </div>
          <span className="text-[10px] tracking-tight">Família</span>
        </Link>

        {/* 5. Categorias */}
        <Link
          href="/categories"
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            isCategories
              ? 'text-primary font-bold scale-105'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <div className={`flex items-center justify-center p-1 rounded-lg ${isCategories ? 'bg-primary/10' : ''}`}>
            <Tag className="h-5 w-5" />
          </div>
          <span className="text-[10px] tracking-tight">Categorias</span>
        </Link>
      </div>
    </nav>
  );
};
