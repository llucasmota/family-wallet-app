import { addMonths, format, parseISO } from 'date-fns';

export interface SplitInput {
  memberId: string;
  percentage: number;
}

export interface SplitResult {
  memberId: string;
  percentage: number;
  computedAmount: number;
}

export interface InstallmentScheduleItem {
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  description: string;
}

export interface MemberDebt {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}

/**
 * Calculates accurate split amounts ensuring rounding issues don't lose cents
 */
export function calculateSplits(totalAmount: number, splits: SplitInput[]): SplitResult[] {
  if (splits.length === 0) return [];
  
  const totalPercentage = splits.reduce((acc, s) => acc + s.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error(`Total percentage must sum to 100%, received ${totalPercentage}%`);
  }

  let distributedAmount = 0;
  const results: SplitResult[] = [];

  for (let i = 0; i < splits.length; i++) {
    const split = splits[i];
    if (i === splits.length - 1) {
      // Last person gets the exact remaining to avoid decimal discrepancy (e.g. 100 / 3)
      const remaining = Number((totalAmount - distributedAmount).toFixed(2));
      results.push({
        memberId: split.memberId,
        percentage: split.percentage,
        computedAmount: remaining,
      });
    } else {
      const calculated = Number(((totalAmount * split.percentage) / 100).toFixed(2));
      distributedAmount += calculated;
      results.push({
        memberId: split.memberId,
        percentage: split.percentage,
        computedAmount: calculated,
      });
    }
  }

  return results;
}

/**
 * Generates an installment series with deterministic monthly due dates
 */
export function generateInstallmentSchedule(
  description: string,
  totalAmount: number,
  totalInstallments: number,
  firstDueDate: string // YYYY-MM-DD
): InstallmentScheduleItem[] {
  if (totalInstallments < 1) {
    throw new Error('Total installments must be at least 1');
  }

  const baseDate = parseISO(firstDueDate);
  const baseInstallmentAmount = Number((totalAmount / totalInstallments).toFixed(2));
  let allocated = 0;
  const schedule: InstallmentScheduleItem[] = [];

  for (let i = 1; i <= totalInstallments; i++) {
    const currentDueDate = format(addMonths(baseDate, i - 1), 'yyyy-MM-dd');
    let installmentAmount = baseInstallmentAmount;

    if (i === totalInstallments) {
      // Adjust remainder on final installment
      installmentAmount = Number((totalAmount - allocated).toFixed(2));
    } else {
      allocated += installmentAmount;
    }

    schedule.push({
      installmentNumber: i,
      totalInstallments,
      amount: installmentAmount,
      dueDate: currentDueDate,
      description: `${description} (${i}/${totalInstallments})`,
    });
  }

  return schedule;
}

/**
 * Computes net settlement between members including shared expenses,
 * initial starting credits, and prior settlements.
 */
export function calculateNetSettlements(
  members: string[],
  paidExpenses: Array<{
    payerId: string;
    splits: Array<{ memberId: string; computedAmount: number }>;
  }>,
  initialCredits: Array<{
    creditorId: string;
    debtorId: string;
    amount: number;
  }> = [],
  settlementsMade: Array<{
    fromMemberId: string;
    toMemberId: string;
    amount: number;
  }> = []
): MemberDebt[] {
  // Balance map: positive means member is owed money, negative means member owes money
  const balances: Record<string, number> = {};
  for (const m of members) balances[m] = 0;

  // 1. Incorporate Initial Starting Credits
  for (const credit of initialCredits) {
    balances[credit.creditorId] = (balances[credit.creditorId] || 0) + credit.amount;
    balances[credit.debtorId] = (balances[credit.debtorId] || 0) - credit.amount;
  }

  // 2. Incorporate Shared Expenses
  for (const exp of paidExpenses) {
    for (const split of exp.splits) {
      if (split.memberId !== exp.payerId) {
        // Split member owes the payer this amount
        balances[split.memberId] = (balances[split.memberId] || 0) - split.computedAmount;
        balances[exp.payerId] = (balances[exp.payerId] || 0) + split.computedAmount;
      }
    }
  }

  // 3. Incorporate Settlements already paid
  for (const set of settlementsMade) {
    // fromMember paid toMember, reducing the debt
    balances[set.fromMemberId] = (balances[set.fromMemberId] || 0) + set.amount;
    balances[set.toMemberId] = (balances[set.toMemberId] || 0) - set.amount;
  }

  const debtors: Array<{ id: string; amount: number }> = [];
  const creditors: Array<{ id: string; amount: number }> = [];

  for (const [id, net] of Object.entries(balances)) {
    const rounded = Number(net.toFixed(2));
    if (rounded < -0.01) debtors.push({ id, amount: -rounded });
    else if (rounded > 0.01) creditors.push({ id, amount: rounded });
  }

  const debts: MemberDebt[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];
    const settleAmount = Number(Math.min(debtor.amount, creditor.amount).toFixed(2));

    if (settleAmount > 0) {
      debts.push({
        fromMemberId: debtor.id,
        toMemberId: creditor.id,
        amount: settleAmount,
      });
    }

    debtor.amount = Number((debtor.amount - settleAmount).toFixed(2));
    creditor.amount = Number((creditor.amount - settleAmount).toFixed(2));

    if (debtor.amount <= 0.01) dIdx++;
    if (creditor.amount <= 0.01) cIdx++;
  }

  return debts;
}

/**
 * Predicts next month forecast and determines trend direction
 */
export function calculateSpendingTrend(
  pastMonthsTotals: number[], // e.g. [2500, 2700, 2600]
  currentMonthTotal: number,
  nextMonthCommitted: number
): {
  averagePast: number;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
} {
  const sumPast = pastMonthsTotals.reduce((a, b) => a + b, 0);
  const averagePast = pastMonthsTotals.length > 0 ? Number((sumPast / pastMonthsTotals.length).toFixed(2)) : currentMonthTotal;
  
  if (averagePast === 0) {
    return { averagePast: 0, trend: 'stable', percentageChange: 0 };
  }

  const diff = nextMonthCommitted - averagePast;
  const percentageChange = Number(((diff / averagePast) * 100).toFixed(1));

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (percentageChange > 3) trend = 'up';
  else if (percentageChange < -3) trend = 'down';

  return {
    averagePast,
    trend,
    percentageChange,
  };
}
