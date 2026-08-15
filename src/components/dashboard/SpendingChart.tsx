'use client';

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PieChart as PieIcon, BarChart3 as BarIcon } from 'lucide-react';
import { Button } from '../ui/Button';

export interface CategorySpending {
  name: string;
  amount: number;
  color: string;
  percentage: number;
}

export interface SpendingChartProps {
  categories: CategorySpending[];
  historicalMonthly: Array<{ month: string; amount: number }>;
}

export const SpendingChart: React.FC<SpendingChartProps> = ({ categories, historicalMonthly }) => {
  const [chartType, setChartType] = useState<'donut' | 'history'>('donut');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Custom High-Contrast Tooltip for Donut
  const CustomDonutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="rounded-m3-md bg-[#1C2220] text-white px-3.5 py-2.5 shadow-m3-3 border border-white/10 text-xs flex flex-col gap-1 z-50">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: data.payload?.color || data.color }}
            />
            <span className="font-semibold text-slate-100">{data.name}</span>
          </div>
          <div className="font-bold text-primary-on-container text-sm text-emerald-400">
            {formatCurrency(data.value)}
          </div>
          <span className="text-[10px] text-slate-400">
            {data.payload?.percentage ? `${data.payload.percentage}% do total do mês` : ''}
          </span>
        </div>
      );
    }
    return null;
  };

  // Custom High-Contrast Tooltip for Bar Chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-m3-md bg-[#1C2220] text-white px-3.5 py-2.5 shadow-m3-3 border border-white/10 text-xs flex flex-col gap-1 z-50">
          <span className="font-semibold text-slate-300">{label}</span>
          <div className="font-bold text-emerald-400 text-sm">
            {formatCurrency(payload[0].value)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card variant="elevated" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20 dark:border-white/[0.06] pb-3">
        <div>
          <h3 className="font-semibold text-on-surface">
            {chartType === 'donut' ? 'Distribuição por Categoria' : 'Evolução dos Gastos'}
          </h3>
          <p className="text-xs text-on-surface-variant">
            {chartType === 'donut' ? 'Visão detalhada do mês atual' : 'Histórico dos últimos meses'}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-surface-container rounded-m3-full p-1 dark:bg-[#141816]">
          <Button
            variant={chartType === 'donut' ? 'filled' : 'text'}
            size="sm"
            onClick={() => setChartType('donut')}
            className="h-8 px-3 text-xs"
          >
            <PieIcon className="h-3.5 w-3.5" />
            Categorias
          </Button>
          <Button
            variant={chartType === 'history' ? 'filled' : 'text'}
            size="sm"
            onClick={() => setChartType('history')}
            className="h-8 px-3 text-xs"
          >
            <BarIcon className="h-3.5 w-3.5" />
            Histórico
          </Button>
        </div>
      </div>

      <div className="h-64 w-full">
        {chartType === 'donut' ? (
          <div className="flex h-full flex-col items-center justify-center sm:flex-row">
            <div className="h-full w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomDonutTooltip />} />
                  <Pie
                    data={categories}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {categories.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Interactive Legends */}
            <div className="flex max-h-48 w-full flex-col gap-2 overflow-y-auto sm:w-1/2 pr-2">
              {categories.map((cat, i) => (
                <div
                  key={cat.name}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`flex items-center justify-between rounded-m3-sm p-1.5 transition-colors cursor-pointer text-xs ${
                    activeIndex === i ? 'bg-surface-container-highest dark:bg-white/[0.08]' : 'hover:bg-surface-container dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-medium text-on-surface">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-on-surface">
                    <span>{formatCurrency(cat.amount)}</span>
                    <span className="text-[10px] text-on-surface-variant">
                      ({cat.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historicalMonthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="var(--md-outline-variant)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--md-on-surface-variant)' }} />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--md-on-surface-variant)' }}
                tickFormatter={(val) => `R$${val}`}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="amount" fill="var(--md-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
