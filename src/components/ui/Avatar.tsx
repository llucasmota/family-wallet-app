import React from 'react';
import { User, Heart, Baby, Shield } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  role?: 'admin' | 'member' | 'child';
  avatarKey?: 'husband' | 'wife' | 'child' | 'custom' | string;
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({
  role = 'member',
  avatarKey = 'husband',
  name,
  color = '#1E6B52',
  size = 'md',
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
  }[size];

  const getRoleIcon = () => {
    if (avatarKey === 'wife' || avatarKey === 'esposa') return <Heart className="h-4 w-4" />;
    if (avatarKey === 'child' || avatarKey === 'filho' || role === 'child')
      return <Baby className="h-4 w-4" />;
    if (role === 'admin') return <Shield className="h-4 w-4" />;
    return <User className="h-4 w-4" />;
  };

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className={twMerge(
        clsx(
          'relative inline-flex items-center justify-center rounded-m3-full font-semibold text-white shadow-m3-1 select-none',
          sizeClasses,
          className
        )
      )}
      style={{ backgroundColor: color }}
      title={`${name} (${role})`}
      {...props}
    >
      <span>{initials}</span>
      <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-surface text-on-surface ring-2 ring-surface">
        {getRoleIcon()}
      </div>
    </div>
  );
};
