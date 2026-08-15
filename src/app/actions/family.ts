'use server';

import { db } from '@/db';
import { families, familyMembers, categories, expenses, expenseSplits, settlements } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { calculateNetSettlements } from '@/services/expense-calculator';
import { revalidatePath } from 'next/cache';

export async function getFamilyDataAction() {
  try {
    // 1. Get first active family (or default family from seed)
    const [family] = await db.query.families.findMany({
      limit: 1,
      with: {
        members: true,
        categories: true,
      },
    });

    if (!family) {
      return { success: false, error: 'Nenhuma família encontrada' };
    }

    // 2. Fetch all paid expenses with splits to calculate dynamic settlement
    const paidExpenses = await db.query.expenses.findMany({
      where: and(eq(expenses.familyId, family.id), eq(expenses.status, 'paid')),
      with: {
        splits: true,
      },
    });

    const mappedPaid = paidExpenses.map((e) => ({
      payerId: e.payerMemberId,
      splits: e.splits.map((s) => ({
        memberId: s.memberId,
        computedAmount: parseFloat(s.computedAmount),
      })),
    }));

    // 3. Fetch past settlements/transfers already logged
    const loggedSettlements = await db.query.settlements.findMany({
      where: eq(settlements.familyId, family.id),
    });

    const mappedSettlements = loggedSettlements.map((s) => ({
      fromMemberId: s.fromMemberId,
      toMemberId: s.toMemberId,
      amount: parseFloat(s.amount),
    }));

    const memberIds = family.members.map((m) => m.id);

    const netDebts = calculateNetSettlements(
      memberIds,
      mappedPaid,
      [], // initial credits
      mappedSettlements
    );

    // Format debts with member names and avatars
    const formattedDebts = netDebts.map((debt) => {
      const fromMember = family.members.find((m) => m.id === debt.fromMemberId);
      const toMember = family.members.find((m) => m.id === debt.toMemberId);
      return {
        fromMemberId: debt.fromMemberId,
        fromName: fromMember?.displayName || 'Membro',
        fromAvatarKey: fromMember?.avatarKey || 'husband',
        toMemberId: debt.toMemberId,
        toName: toMember?.displayName || 'Membro',
        toAvatarKey: toMember?.avatarKey || 'wife',
        amount: debt.amount,
      };
    });

    return {
      success: true,
      family: {
        id: family.id,
        name: family.name,
        currency: family.currency,
        members: family.members,
        categories: family.categories,
      },
      settlements: formattedDebts,
    };
  } catch (error: any) {
    console.error('Error fetching family data:', error);
    return { success: false, error: error.message };
  }
}

export async function recordSettlementAction(payload: {
  familyId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  note?: string;
}) {
  try {
    const [inserted] = await db
      .insert(settlements)
      .values({
        familyId: payload.familyId,
        fromMemberId: payload.fromMemberId,
        toMemberId: payload.toMemberId,
        amount: payload.amount.toFixed(2),
        settlementDate: new Date().toISOString().split('T')[0],
        notes: payload.note || 'Acerto de contas realizado',
      })
      .returning();

    revalidatePath('/');
    revalidatePath('/family');
    revalidatePath('/expenses');

    return { success: true, data: inserted };
  } catch (error: any) {
    console.error('Error recording settlement:', error);
    return { success: false, error: error.message };
  }
}
