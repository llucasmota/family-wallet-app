'use server';

import { ExpenseService, CreateExpensePayload } from '@/services/expense-service';
import { db } from '@/db';
import { expenses, categories, familyMembers, expenseSplits, families } from '@/db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { revalidatePath } from 'next/cache';
import { DEFAULT_CATEGORIES } from '@/db/default-categories';

function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function addExpenseAction(payload: CreateExpensePayload) {
  try {
    let { familyId, payerMemberId, categoryId, splits } = payload;

    // 1. Resolve familyId
    if (!isValidUUID(familyId)) {
      const [firstFam] = await db.query.families.findMany({ limit: 1 });
      if (firstFam) {
        familyId = firstFam.id;
      } else {
        const [newFam] = await db.insert(families).values({ name: 'Minha Família', currency: 'BRL' }).returning();
        familyId = newFam.id;
      }
    }

    // 2. Resolve payerMemberId
    if (!isValidUUID(payerMemberId)) {
      const [firstMember] = await db.query.familyMembers.findMany({
        where: eq(familyMembers.familyId, familyId),
        limit: 1,
      });
      if (firstMember) {
        payerMemberId = firstMember.id;
      } else {
        const [newMember] = await db
          .insert(familyMembers)
          .values({
            familyId,
            displayName: 'Administrador',
            role: 'admin',
            avatarKey: 'husband',
            color: '#1E6B52',
          })
          .returning();
        payerMemberId = newMember.id;
      }
    }

    // 3. Resolve categoryId
    if (!isValidUUID(categoryId)) {
      const [firstCat] = await db.query.categories.findMany({
        where: eq(categories.familyId, familyId),
        limit: 1,
      });
      if (firstCat) {
        categoryId = firstCat.id;
      } else {
        // Seed default categories
        const [newCat] = await db
          .insert(categories)
          .values({
            familyId,
            name: DEFAULT_CATEGORIES[0].name,
            icon: DEFAULT_CATEGORIES[0].icon,
            color: DEFAULT_CATEGORIES[0].color,
            isDefault: true,
          })
          .returning();
        categoryId = newCat.id;
      }
    }

    // 4. Sanitize splits
    const validSplits = (splits || [])
      .filter((s) => isValidUUID(s.memberId))
      .map((s) => ({ memberId: s.memberId, percentage: s.percentage }));

    const resolvedSplits =
      validSplits.length > 0 ? validSplits : [{ memberId: payerMemberId, percentage: 100 }];

    const result = await ExpenseService.createExpense({
      ...payload,
      familyId,
      payerMemberId,
      categoryId,
      splits: resolvedSplits,
    });

    revalidatePath('/');
    revalidatePath('/expenses');
    revalidatePath('/family');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error adding expense:', error);
    return { success: false, error: error.message || 'Falha ao salvar despesa' };
  }
}

export async function toggleExpenseStatusAction(expenseId: string, currentStatus: 'paid' | 'pending') {
  try {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    const paymentDate = newStatus === 'paid' ? new Date().toISOString().split('T')[0] : null;

    const [updated] = await db
      .update(expenses)
      .set({
        status: newStatus,
        paymentDate,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, expenseId))
      .returning();

    revalidatePath('/');
    revalidatePath('/expenses');
    revalidatePath('/family');

    return { success: true, data: updated };
  } catch (error: any) {
    console.error('Error toggling expense status:', error);
    return { success: false, error: error.message };
  }
}

export async function updateExpenseAction(payload: {
  expenseId: string;
  description: string;
  amount: number;
  dueDate: string;
  categoryId?: string;
  payerMemberId?: string;
  status: 'paid' | 'pending';
  notes?: string;
}) {
  try {
    const paymentDate = payload.status === 'paid' ? new Date().toISOString().split('T')[0] : null;

    const [updated] = await db
      .update(expenses)
      .set({
        description: payload.description.trim(),
        amount: payload.amount.toFixed(2),
        dueDate: payload.dueDate,
        ...(payload.categoryId ? { categoryId: payload.categoryId } : {}),
        ...(payload.payerMemberId ? { payerMemberId: payload.payerMemberId } : {}),
        ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
        status: payload.status,
        paymentDate,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, payload.expenseId))
      .returning();

    revalidatePath('/');
    revalidatePath('/expenses');
    revalidatePath('/family');

    return { success: true, data: updated };
  } catch (error: any) {
    console.error('Error updating expense:', error);
    return { success: false, error: error.message || 'Falha ao atualizar despesa' };
  }
}

export async function deleteExpenseAction(expenseId: string) {
  try {
    // Delete associated splits first then the expense
    await db.delete(expenseSplits).where(eq(expenseSplits.expenseId, expenseId));
    await db.delete(expenses).where(eq(expenses.id, expenseId));

    revalidatePath('/');
    revalidatePath('/expenses');
    revalidatePath('/family');

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    return { success: false, error: error.message };
  }
}

export async function getDashboardDataAction(familyId: string, referenceDateStr?: string) {
  try {
    const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
    const metrics = await ExpenseService.getDashboardMetrics(familyId, refDate);
    
    const monthStart = format(startOfMonth(refDate), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(refDate), 'yyyy-MM-dd');

    // Fetch expenses for the selected month
    const rawExpenses = await db.query.expenses.findMany({
      where: and(
        eq(expenses.familyId, familyId),
        gte(expenses.dueDate, monthStart),
        lte(expenses.dueDate, monthEnd)
      ),
      orderBy: [desc(expenses.dueDate)],
      with: {
        payer: true,
        category: true,
        splits: true,
      },
    });

    // Format for frontend consumption
    const formattedRecent = rawExpenses.map((e) => ({
      id: e.id,
      description: e.description,
      amount: parseFloat(e.amount),
      dueDate: e.dueDate,
      status: e.status,
      categoryName: e.category?.name || 'Geral',
      categoryColor: e.category?.color || '#2D7D62',
      payerName: e.payer?.displayName || 'Membro',
      payerRole: e.payer?.role || 'member',
      payerAvatarKey: e.payer?.avatarKey || 'husband',
      expenseType: e.expenseType,
      installmentInfo: e.installmentNumber ? `${e.installmentNumber}/${e.totalInstallments}` : undefined,
      splitSummary: 'Dividido 50% / 50%',
    }));

    return { success: true, metrics, recentExpenses: formattedRecent };
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return { success: false, error: error.message };
  }
}
