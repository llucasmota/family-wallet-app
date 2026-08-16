'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

export interface MonthPickerProps {
  currentDate: Date;
  onChange: (newDate: Date) => void;
}

export const MonthPicker: React.FC<MonthPickerProps> = ({ currentDate, onChange }) => {
  const locale = useLocale();
  const tCommon = useTranslations('Common');

  const handlePrev = () => {
    const prev = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    onChange(prev);
  };

  const handleNext = () => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    onChange(next);
  };

  const handleCurrentMonth = () => {
    onChange(new Date());
  };

  const isCurrentMonth =
    currentDate.getMonth() === new Date().getMonth() &&
    currentDate.getFullYear() === new Date().getFullYear();

  const formatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  const rawFormatted = formatter.format(currentDate);
  const formattedMonthYear = rawFormatted.charAt(0).toUpperCase() + rawFormatted.slice(1);

  return (
    <div className="flex items-center gap-1.5 rounded-m3-full border border-outline-variant/30 bg-surface-container dark:bg-[#141816] p-1 text-xs shadow-m3-1">
      <button
        onClick={handlePrev}
        title={locale === 'en' ? 'Previous Month' : 'Mês Anterior'}
        className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest dark:hover:bg-white/[0.08] hover:text-on-surface transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-1.5 px-2 font-bold text-on-surface min-w-[130px] justify-center text-xs">
        <Calendar className="h-3.5 w-3.5 text-primary" />
        <span>{formattedMonthYear}</span>
      </div>

      <button
        onClick={handleNext}
        title={locale === 'en' ? 'Next Month' : 'Próximo Mês'}
        className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest dark:hover:bg-white/[0.08] hover:text-on-surface transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {!isCurrentMonth && (
        <button
          onClick={handleCurrentMonth}
          className="ml-1 rounded-m3-full bg-primary-container px-2 py-0.5 text-[10px] font-bold text-primary hover:bg-primary-container/80 transition-colors"
        >
          {tCommon('today')}
        </button>
      )}
    </div>
  );
};
