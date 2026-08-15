'use client';

import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | string;
  onChange: (value: number) => void;
  currency?: string; // 'BRL' | 'USD' | 'EUR'
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  currency = 'BRL',
  className,
  ...props
}) => {
  const getPrefix = () => {
    switch (currency) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'BRL':
      default:
        return 'R$';
    }
  };

  // Convert numeric value to formatted string (e.g. 1500.50 -> "1.500,50")
  const formatRawToDisplay = (val: number): string => {
    if (isNaN(val) || val === 0) return '';
    return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const [displayValue, setDisplayValue] = useState<string>(() => {
    const num = typeof value === 'number' ? value : parseFloat(value) || 0;
    return formatRawToDisplay(num);
  });

  useEffect(() => {
    const num = typeof value === 'number' ? value : parseFloat(value) || 0;
    setDisplayValue(formatRawToDisplay(num));
  }, [value, currency]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, ''); // Extract digits only

    if (!raw) {
      setDisplayValue('');
      onChange(0);
      return;
    }

    const numericValue = parseInt(raw, 10) / 100;
    setDisplayValue(formatRawToDisplay(numericValue));
    onChange(numericValue);
  };

  return (
    <div className="relative flex items-center w-full">
      <span className="absolute left-3.5 text-sm font-semibold text-on-surface-variant select-none">
        {getPrefix()}
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder="0,00"
        className={twMerge(
          clsx(
            'w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] pl-11 pr-3.5 py-2.5 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none transition-colors',
            className
          )
        )}
        {...props}
      />
    </div>
  );
};
