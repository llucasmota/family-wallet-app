'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from './Button';

export interface MonthPickerProps {
  currentDate: Date;
  onChange: (newDate: Date) => void;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const MonthPicker: React.FC<MonthPickerProps> = ({ currentDate, onChange }) => {
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

  const formattedMonthYear = `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  return (
    <div className="flex items-center gap-1.5 rounded-m3-full border border-outline-variant/30 bg-surface-container dark:bg-[#141816] p-1 text-xs shadow-m3-1">
      <button
        onClick={handlePrev}
        title="Mês Anterior"
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
        title="Próximo Mês"
        className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest dark:hover:bg-white/[0.08] hover:text-on-surface transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {!isCurrentMonth && (
        <button
          onClick={handleCurrentMonth}
          className="ml-1 rounded-m3-full bg-primary-container px-2 py-0.5 text-[10px] font-bold text-primary hover:bg-primary-container/80 transition-colors"
        >
          Hoje
        </button>
      )}
    </div>
  );
};
