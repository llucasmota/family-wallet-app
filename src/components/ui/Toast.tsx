'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  isVisible,
  onClose,
  duration = 3500,
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-sky-500 shrink-0" />,
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-m3-lg border border-outline-variant/30 bg-surface dark:bg-[#1E2421] px-4 py-3.5 text-xs font-semibold text-on-surface shadow-m3-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
      {icons[type]}
      <span className="max-w-xs">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 rounded-full p-1 text-on-surface-variant hover:bg-surface-container transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
