'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { LogOut, User, Shield, Heart, Baby, ChevronDown } from 'lucide-react';
import { signOutAction } from '@/app/actions/auth';

export interface UserMenuProps {
  displayName?: string;
  email?: string;
  role?: 'admin' | 'member' | 'child';
  avatarKey?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  displayName = 'Minha Conta',
  email = '',
  role = 'admin',
  avatarKey = 'husband',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSignOut = async () => {
    await signOutAction();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-m3-full p-0.5 hover:ring-2 hover:ring-primary/40 transition-all focus:outline-none"
        aria-expanded={isOpen}
      >
        <Avatar
          name={displayName}
          role={role}
          avatarKey={avatarKey}
          size="sm"
        />
        <ChevronDown className="h-3 w-3 text-on-surface-variant hidden sm:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-m3-lg border border-outline-variant/30 bg-surface dark:bg-[#1A1F1D] p-2 shadow-m3-3 z-50 animate-in fade-in duration-150">
          {/* User Info Header */}
          <div className="border-b border-outline-variant/20 dark:border-white/[0.06] p-2.5 flex flex-col gap-0.5">
            <span className="text-xs font-bold text-on-surface">{displayName}</span>
            {email && <span className="text-[11px] text-on-surface-variant truncate">{email}</span>}
            <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-primary">
              <Shield className="h-3 w-3" />
              <span>{role === 'admin' ? 'Administrador Familiar' : 'Membro'}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-m3-md px-2.5 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
