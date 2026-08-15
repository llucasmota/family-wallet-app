import { describe, it, expect } from 'vitest';
import {
  calculateSplits,
  generateInstallmentSchedule,
  calculateNetSettlements,
  calculateSpendingTrend,
} from './expense-calculator';

describe('Financial Logic & Projection Engine', () => {
  describe('calculateSplits', () => {
    it('should split 50/50 cleanly', () => {
      const result = calculateSplits(100, [
        { memberId: 'husband', percentage: 50 },
        { memberId: 'wife', percentage: 50 },
      ]);
      expect(result).toEqual([
        { memberId: 'husband', percentage: 50, computedAmount: 50 },
        { memberId: 'wife', percentage: 50, computedAmount: 50 },
      ]);
    });

    it('should handle odd divisions without losing cents (33.33 / 33.33 / 33.34)', () => {
      const result = calculateSplits(100, [
        { memberId: 'user1', percentage: 33.33 },
        { memberId: 'user2', percentage: 33.33 },
        { memberId: 'user3', percentage: 33.34 },
      ]);
      const total = result.reduce((acc, r) => acc + r.computedAmount, 0);
      expect(Number(total.toFixed(2))).toBe(100.0);
    });

    it('should throw if percentages do not sum to 100%', () => {
      expect(() =>
        calculateSplits(100, [
          { memberId: 'user1', percentage: 50 },
          { memberId: 'user2', percentage: 40 },
        ])
      ).toThrow('Total percentage must sum to 100%');
    });
  });

  describe('generateInstallmentSchedule', () => {
    it('should generate 3 installments on consecutive months', () => {
      const schedule = generateInstallmentSchedule('Geladeira', 1000, 3, '2026-05-10');
      expect(schedule).toHaveLength(3);
      expect(schedule[0].dueDate).toBe('2026-05-10');
      expect(schedule[1].dueDate).toBe('2026-06-10');
      expect(schedule[2].dueDate).toBe('2026-07-10');

      const sum = schedule.reduce((acc, item) => acc + item.amount, 0);
      expect(Number(sum.toFixed(2))).toBe(1000.0);
    });
  });

  describe('calculateNetSettlements', () => {
    it('should determine who owes whom accurately', () => {
      // Husband paid 200 for a shared dinner (50/50)
      const paidExpenses = [
        {
          payerId: 'husband',
          splits: [
            { memberId: 'husband', computedAmount: 100 },
            { memberId: 'wife', computedAmount: 100 },
          ],
        },
      ];

      const debts = calculateNetSettlements(['husband', 'wife'], paidExpenses);
      expect(debts).toEqual([
        {
          fromMemberId: 'wife',
          toMemberId: 'husband',
          amount: 100,
        },
      ]);
    });

    it('should incorporate pre-existing initial credits seamlessly', () => {
      // Wife starts with a pre-existing credit of 300 over husband
      const initialCredits = [{ creditorId: 'wife', debtorId: 'husband', amount: 300 }];
      
      // Husband later pays a 200 shared expense (wife owes him 100)
      const paidExpenses = [
        {
          payerId: 'husband',
          splits: [
            { memberId: 'husband', computedAmount: 100 },
            { memberId: 'wife', computedAmount: 100 },
          ],
        },
      ];

      // Net: 300 (husband owes wife) - 100 (wife owes husband) = 200 husband owes wife
      const debts = calculateNetSettlements(['husband', 'wife'], paidExpenses, initialCredits);
      expect(debts).toEqual([
        {
          fromMemberId: 'husband',
          toMemberId: 'wife',
          amount: 200,
        },
      ]);
    });
  });

  describe('calculateSpendingTrend', () => {
    it('should detect upward trend when next month commitment is higher than 3-month average', () => {
      const trend = calculateSpendingTrend([2000, 2000, 2000], 2000, 2500);
      expect(trend.trend).toBe('up');
      expect(trend.percentageChange).toBe(25);
    });

    it('should detect downward trend when next month commitment is significantly lower', () => {
      const trend = calculateSpendingTrend([3000, 3000, 3000], 3000, 2400);
      expect(trend.trend).toBe('down');
      expect(trend.percentageChange).toBe(-20);
    });
  });
});
