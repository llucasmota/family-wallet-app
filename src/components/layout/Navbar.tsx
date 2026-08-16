'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { UserMenu } from './UserMenu';
import { MobileBottomNav } from './MobileBottomNav';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { Wallet, LayoutDashboard, Receipt, Users, Sparkles, Plus, Tag } from 'lucide-react';

export interface NavbarProps {
  onOpenAgent: () => void;
  onOpenQuickAdd: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAgent, onOpenQuickAdd }) => {
  const pathname = usePathname();
  const tNav = useTranslations('Navigation');

  const [currentMember, setCurrentMember] = useState<{
    displayName: string;
    role: 'admin' | 'member' | 'child';
    avatarKey: string;
  } | null>(null);

  useEffect(() => {
    // Dynamically fetch active user's family member profile
    async function loadProfile() {
      try {
        const { getFamilyDataAction } = await import('@/app/actions/family');
        const res = await getFamilyDataAction();
        if (res.success && res.family?.members && res.family.members.length > 0) {
          const matched =
            res.family.members.find((m: any) => m.userId === res.currentUserId) ||
            res.family.members[0];

          setCurrentMember({
            displayName: matched.displayName,
            role: matched.role as any,
            avatarKey: matched.avatarKey,
          });
        }
      } catch {}
    }
    loadProfile();
  }, [pathname]);

  const navLinks = [
    { href: '/', label: tNav('overview'), icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: '/expenses', label: tNav('expenses'), icon: <Receipt className="h-4 w-4" /> },
    { href: '/family', label: tNav('family'), icon: <Users className="h-4 w-4" /> },
    { href: '/categories', label: tNav('categories'), icon: <Tag className="h-4 w-4" /> },
  ];

  return (
    <>
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
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Language Switcher Pill */}
            <LanguageSwitcher variant="pill" />

            {/* Agent Mode Trigger - Desktop Only */}
            <Button
              variant="tonal"
              size="sm"
              onClick={onOpenAgent}
              aria-label={tNav('agentMode')}
              title={tNav('agentMode')}
              className="gap-1.5 text-xs font-semibold bg-primary-container/80 text-primary border border-primary/30 h-9 px-3 hidden sm:inline-flex"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{tNav('agentMode')}</span>
            </Button>

            {/* Quick Add Expense - Desktop Only */}
            <Button
              variant="filled"
              size="sm"
              onClick={onOpenQuickAdd}
              className="gap-1 text-xs h-9 px-3 hidden sm:inline-flex"
            >
              <Plus className="h-4 w-4" />
              <span>{tNav('newExpense')}</span>
            </Button>

            <ThemeToggle />

            <UserMenu
              displayName={currentMember?.displayName || 'Minha Conta'}
              role={currentMember?.role || 'admin'}
              avatarKey={currentMember?.avatarKey || 'husband'}
            />
          </div>
        </div>
      </header>

      {/* Floating Mobile Bottom Navigation Dock (Placed outside sticky header to attach to viewport bottom) */}
      <MobileBottomNav onOpenQuickAdd={onOpenQuickAdd} />
    </>
  );
};
