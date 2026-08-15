import React from 'react';
import { User, Heart, Baby, Shield } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AVATAR_PRESETS } from './AvatarPresets';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  role?: 'admin' | 'member' | 'child';
  avatarKey?: string;
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar: React.FC<AvatarProps> = ({
  role = 'member',
  avatarKey = 'husband',
  name,
  color,
  size = 'md',
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-20 w-20 text-xl',
  }[size];

  const preset = AVATAR_PRESETS.find((p) => p.key === avatarKey);
  const bgColor = color || preset?.bgColor || '#1E6B52';

  const getRoleIcon = () => {
    if (avatarKey === 'wife' || avatarKey === 'woman_casual') return <Heart className="h-3 w-3" />;
    if (avatarKey === 'child' || avatarKey === 'boy_1' || avatarKey === 'girl_1' || avatarKey === 'baby' || role === 'child')
      return <Baby className="h-3 w-3" />;
    if (role === 'admin') return <Shield className="h-3 w-3" />;
    return <User className="h-3 w-3" />;
  };

  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div
      className={twMerge(
        clsx(
          'relative inline-flex items-center justify-center rounded-m3-full font-semibold text-white shadow-m3-1 select-none transition-transform',
          sizeClasses,
          className
        )
      )}
      style={{ backgroundColor: bgColor }}
      title={`${name} (${role})`}
      {...props}
    >
      {preset ? (
        <span className={size === 'xl' ? 'text-3xl' : size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-base' : 'text-xs'}>
          {preset.emoji}
        </span>
      ) : (
        <span>{initials}</span>
      )}

      {size !== 'sm' && (
        <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-surface text-on-surface ring-2 ring-surface shadow-xs">
          {getRoleIcon()}
        </div>
      )}
    </div>
  );
};
