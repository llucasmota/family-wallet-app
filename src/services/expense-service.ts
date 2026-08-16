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
import { format, startOfMonth, endOfMonth, addMonths, subMonths, differenceInCalendarDays, parseISO } from 'date-fns';
import { extractPaymentMethod } from './payment-methods';

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
   * Materializes active recurring expense templates into concrete monthly expense records
   */
  static async materializeRecurringExpenses(familyId: string, referenceDate: Date = new Date()) {
    try {
      const activeTemplates = await db.query.recurrenceTemplates.findMany({
        where: and(
          eq(recurrenceTemplates.familyId, familyId),
          eq(recurrenceTemplates.isActive, true)
        ),
      });

      if (!activeTemplates || activeTemplates.length === 0) return [];

      const monthStart = format(startOfMonth(referenceDate), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(referenceDate), 'yyyy-MM-dd');
      const yearMonth = format(referenceDate, 'yyyy-MM');

      const existingExpenses = await db.query.expenses.findMany({
        where: and(
          eq(expenses.familyId, familyId),
          gte(expenses.dueDate, monthStart),
          lte(expenses.dueDate, monthEnd)
        ),
      });

      const existingTemplateIds = new Set(
        existingExpenses.filter((e) => e.recurrenceTemplateId).map((e) => e.recurrenceTemplateId)
      );

      const created: any[] = [];
      const members = await db.query.familyMembers.findMany({
        where: eq(familyMembers.familyId, familyId),
      });

      for (const template of activeTemplates) {
        if (!existingTemplateIds.has(template.id)) {
          const day = Math.min(Math.max(template.dayOfMonth || 1, 1), 28);
          const formattedDay = day < 10 ? `0${day}` : `${day}`;
          const dueDate = `${yearMonth}-${formattedDay}`;

          const amountNum = parseFloat(template.amount);
          const splitsInput: SplitInput[] =
            members.length > 0
              ? members.map((m) => ({ memberId: m.id, percentage: 100 / members.length }))
              : [{ memberId: template.payerMemberId, percentage: 100 }];

          const calculatedSplits = calculateSplits(amountNum, splitsInput);

          const [inserted] = await db
            .insert(expenses)
            .values({
              familyId,
              payerMemberId: template.payerMemberId,
              categoryId: template.categoryId,
              recurrenceTemplateId: template.id,
              description: template.description,
              amount: template.amount,
              dueDate,
              status: 'pending',
              expenseType: 'recurring',
              notes: '[PAYMENT:c6_card] Despesa Fixa Recorrente',
            })
            .returning();

          if (calculatedSplits.length > 0) {
            await db.insert(expenseSplits).values(
              calculatedSplits.map((s) => ({
                expenseId: inserted.id,
                memberId: s.memberId,
                percentage: s.percentage.toFixed(2),
                computedAmount: s.computedAmount.toFixed(2),
              }))
            );
          }
          created.push(inserted);
        }
      }

      return created;
    } catch (err) {
      console.error('Error materializing recurring expenses:', err);
      return [];
    }
  }

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
              status: 'pending',
              expenseType: 'installment',
              installmentNumber: item.installmentNumber,
              totalInstallments: item.totalInstallments,
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
   * Fetches monthly metrics, C6 Bank Card invoice, due date alerts and trend forecasts
   */
  static async getDashboardMetrics(familyId: string, referenceDate: Date = new Date()) {
    // Auto-materialize any missing recurring expenses for the current month
    await ExpenseService.materializeRecurringExpenses(familyId, referenceDate);

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
      with: {
        payer: true,
      },
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

    // C6 Bank Card Specific Metrics
    const c6Expenses = currentMonthExpenses.filter(
      (e) => extractPaymentMethod(e.notes) === 'c6_card'
    );
    const c6Total = c6Expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const c6Paid = c6Expenses
      .filter((e) => e.status === 'paid')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const c6Pending = c6Expenses
      .filter((e) => e.status === 'pending')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const c6ByMemberMap: Record<string, { memberName: string; amount: number }> = {};
    for (const exp of c6Expenses) {
      const pName = exp.payer?.displayName || 'Outro';
      if (!c6ByMemberMap[pName]) {
        c6ByMemberMap[pName] = { memberName: pName, amount: 0 };
      }
      c6ByMemberMap[pName].amount += parseFloat(exp.amount);
    }
    const c6ByMember = Object.values(c6ByMemberMap);

    // Alerts (Overdue & Due in next 3 days)
    const today = new Date();
    let overdueCount = 0;
    let overdueAmount = 0;
    let dueSoonCount = 0;
    let dueSoonAmount = 0;

    for (const exp of currentMonthExpenses) {
      if (exp.status === 'pending') {
        const val = parseFloat(exp.amount);
        try {
          const days = differenceInCalendarDays(parseISO(exp.dueDate), today);
          if (days < 0) {
            overdueCount++;
            overdueAmount += val;
          } else if (days <= 3) {
            dueSoonCount++;
            dueSoonAmount += val;
          }
        } catch {}
      }
    }

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
      c6Invoice: {
        total: c6Total,
        paid: c6Paid,
        pending: c6Pending,
        itemsCount: c6Expenses.length,
        byMember: c6ByMember,
      },
      alerts: {
        overdueCount,
        overdueAmount,
        dueSoonCount,
        dueSoonAmount,
      },
    };
  }
}
