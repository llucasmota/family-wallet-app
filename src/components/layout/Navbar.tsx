'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { UserMenu } from './UserMenu';
import { Wallet, LayoutDashboard, Receipt, Users, Sparkles, Plus, Globe, Tag } from 'lucide-react';

export interface NavbarProps {
  onOpenAgent: () => void;
  onOpenQuickAdd: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAgent, onOpenQuickAdd }) => {
  const pathname = usePathname();
  const router = useRouter();

  // Detect current locale
  const isPt = !pathname.startsWith('/en');

  const navLinks = [
    { href: '/', label: 'Visão Geral', icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: '/expenses', label: 'Despesas', icon: <Receipt className="h-4 w-4" /> },
    { href: '/family', label: 'Família', icon: <Users className="h-4 w-4" /> },
    { href: '/categories', label: 'Categorias', icon: <Tag className="h-4 w-4" /> },
  ];

  const handleToggleLocale = () => {
    if (isPt) {
      router.push('/en' + (pathname === '/' ? '' : pathname));
    } else {
      router.push(pathname.replace(/^\/en/, '') || '/');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-outline-variant/30 bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-on-surface">
            <div className="flex h-9 w-9 items-center justify-center rounded-m3-md bg-primary text-white shadow-m3-1">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-lg tracking-tight">Family Wallet</span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (pathname.startsWith('/en') && pathname === `/en${link.href === '/' ? '' : link.href}`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 rounded-m3-full px-4 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-container text-primary-on-container font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            onClick={handleToggleLocale}
            title="Alternar Idioma (PT / EN)"
            className="flex items-center gap-1 rounded-m3-md border border-outline-variant/30 bg-surface dark:bg-[#141816] px-2 py-1 text-[11px] font-bold text-on-surface-variant hover:text-primary transition-colors"
          >
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span>{isPt ? 'PT' : 'EN'}</span>
          </button>

          {/* Agent Mode Trigger */}
          <Button
            variant="tonal"
            size="sm"
            onClick={onOpenAgent}
            className="gap-1.5 text-xs font-semibold bg-primary-container/70 border border-primary/20"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Modo Agente</span>
          </Button>

          {/* Quick Add Expense */}
          <Button
            variant="filled"
            size="sm"
            onClick={onOpenQuickAdd}
            className="gap-1 text-xs"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Gasto</span>
          </Button>

          <ThemeToggle />

          <UserMenu
            displayName="Lucas Mota"
            role="admin"
            avatarKey="husband"
          />
        </div>
      </div>
    </header>
  );
};
