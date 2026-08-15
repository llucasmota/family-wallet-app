import { db } from '@/db';
import {
  expenses,
  expenseSplits,
  installmentSeries,
  recurrenceTemplates,
  categories,
  familyMembers,
  families,
} from '@/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import {
  calculateSplits,
  generateInstallmentSchedule,
  calculateSpendingTrend,
  SplitInput,
} from './expense-calculator';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

export interface CreateExpensePayload {
  familyId: string;
  payerMemberId: string;
  categoryId: string;
  description: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  paymentDate?: string;
  status?: 'pending' | 'paid';
  expenseType: 'single' | 'installment' | 'recurring';
  installmentsCount?: number;
  splits: SplitInput[];
  notes?: string;
  receiptUrl?: string;
}

export class ExpenseService {
  /**
   * Creates a single, installment or recurring expense with transactional split records
   */
  static async createExpense(payload: CreateExpensePayload) {
    const {
      familyId,
      payerMemberId,
      categoryId,
      description,
      amount,
      dueDate,
      paymentDate,
      status = 'pending',
      expenseType,
      installmentsCount = 1,
      splits,
      notes,
      receiptUrl,
    } = payload;

    const calculatedSplits = calculateSplits(amount, splits);

    // CASE 1: Single Expense
    if (expenseType === 'single') {
      return await db.transaction(async (tx) => {
        const [insertedExpense] = await tx
          .insert(expenses)
          .values({
            familyId,
            payerMemberId,
            categoryId,
            description,
            amount: amount.toFixed(2),
            dueDate,
            paymentDate,
            status,
            expenseType: 'single',
            notes,
            receiptUrl,
          })
          .returning();

        if (calculatedSplits.length > 0) {
          await tx.insert(expenseSplits).values(
            calculatedSplits.map((s) => ({
              expenseId: insertedExpense.id,
              memberId: s.memberId,
              percentage: s.percentage.toFixed(2),
              computedAmount: s.computedAmount.toFixed(2),
            }))
          );
        }

        return insertedExpense;
      });
    }

    // CASE 2: Installment Series
    if (expenseType === 'installment') {
      return await db.transaction(async (tx) => {
        const schedule = generateInstallmentSchedule(
          description,
          amount,
          installmentsCount,
          dueDate
        );

        const [series] = await tx
          .insert(installmentSeries)
          .values({
            familyId,
            description,
            totalAmount: amount.toFixed(2),
            totalInstallments: installmentsCount,
            startDate: schedule[0].dueDate,
            endDate: schedule[schedule.length - 1].dueDate,
          })
          .returning();

        for (const item of schedule) {
          const installmentSplits = calculateSplits(item.amount, splits);

          const [instExpense] = await tx
            .insert(expenses)
            .values({
              familyId,
              payerMemberId,
              categoryId,
              installmentSeriesId: series.id,
              description: item.description,
              amount: item.amount.toFixed(2),
              dueDate: item.dueDate,
              status: item.installmentNumber === 1 && status === 'paid' ? 'paid' : 'pending',
              expenseType: 'installment',
              installmentNumber: item.installmentNumber,
              totalInstallments: installmentsCount,
              notes,
              receiptUrl,
            })
            .returning();

          if (installmentSplits.length > 0) {
            await tx.insert(expenseSplits).values(
              installmentSplits.map((s) => ({
                expenseId: instExpense.id,
                memberId: s.memberId,
                percentage: s.percentage.toFixed(2),
                computedAmount: s.computedAmount.toFixed(2),
              }))
            );
          }
        }

        return series;
      });
    }

    // CASE 3: Recurring Expense
    if (expenseType === 'recurring') {
      return await db.transaction(async (tx) => {
        const [template] = await tx
          .insert(recurrenceTemplates)
          .values({
            familyId,
            payerMemberId,
            categoryId,
            description,
            amount: amount.toFixed(2),
            frequency: 'monthly',
            dayOfMonth: parseInt(dueDate.split('-')[2]) || 1,
            effectiveFrom: dueDate,
            isActive: true,
          })
          .returning();

        const [initialExpense] = await tx
          .insert(expenses)
          .values({
            familyId,
            payerMemberId,
            categoryId,
            recurrenceTemplateId: template.id,
            description,
            amount: amount.toFixed(2),
            dueDate,
            paymentDate,
            status,
            expenseType: 'recurring',
            notes,
            receiptUrl,
          })
          .returning();

        if (calculatedSplits.length > 0) {
          await tx.insert(expenseSplits).values(
            calculatedSplits.map((s) => ({
              expenseId: initialExpense.id,
              memberId: s.memberId,
              percentage: s.percentage.toFixed(2),
              computedAmount: s.computedAmount.toFixed(2),
            }))
          );
        }

        return template;
      });
    }
  }

  /**
   * Fetches monthly metrics and trend forecasts
   */
  static async getDashboardMetrics(familyId: string, referenceDate: Date = new Date()) {
    const currentMonthStart = format(startOfMonth(referenceDate), 'yyyy-MM-dd');
    const currentMonthEnd = format(endOfMonth(referenceDate), 'yyyy-MM-dd');

    const nextMonthStart = format(startOfMonth(addMonths(referenceDate, 1)), 'yyyy-MM-dd');
    const nextMonthEnd = format(endOfMonth(addMonths(referenceDate, 1)), 'yyyy-MM-dd');

    // Current Month Expenses
    const currentMonthExpenses = await db.query.expenses.findMany({
      where: and(
        eq(expenses.familyId, familyId),
        gte(expenses.dueDate, currentMonthStart),
        lte(expenses.dueDate, currentMonthEnd)
      ),
    });

    const totalCurrentMonth = currentMonthExpenses.reduce(
      (sum, e) => sum + parseFloat(e.amount),
      0
    );

    const totalPaid = currentMonthExpenses
      .filter((e) => e.status === 'paid')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const totalPending = currentMonthExpenses
      .filter((e) => e.status === 'pending')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    // Next Month Committed Expenses (Installments + Active Recurring)
    const nextMonthExpenses = await db.query.expenses.findMany({
      where: and(
        eq(expenses.familyId, familyId),
        gte(expenses.dueDate, nextMonthStart),
        lte(expenses.dueDate, nextMonthEnd)
      ),
    });

    const totalNextMonthCommitted = nextMonthExpenses.reduce(
      (sum, e) => sum + parseFloat(e.amount),
      0
    );

    // Past 3 months for average trend calculation
    const pastTotals: number[] = [];
    for (let i = 3; i >= 1; i--) {
      const pStart = format(startOfMonth(subMonths(referenceDate, i)), 'yyyy-MM-dd');
      const pEnd = format(endOfMonth(subMonths(referenceDate, i)), 'yyyy-MM-dd');

      const pastExpenses = await db.query.expenses.findMany({
        where: and(
          eq(expenses.familyId, familyId),
          gte(expenses.dueDate, pStart),
          lte(expenses.dueDate, pEnd)
        ),
      });

      const monthSum = pastExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      pastTotals.push(monthSum);
    }

    const trend = calculateSpendingTrend(
      pastTotals,
      totalCurrentMonth,
      totalNextMonthCommitted
    );

    return {
      totalCurrentMonth,
      totalPaid,
      totalPending,
      totalNextMonthCommitted,
      trend,
    };
  }
}
