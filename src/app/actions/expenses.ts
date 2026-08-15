'use server';

import { ExpenseService, CreateExpensePayload } from '@/services/expense-service';
import { db } from '@/db';
import { expenses, categories, familyMembers, expenseSplits } from '@/db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { revalidatePath } from 'next/cache';

export async function addExpenseAction(payload: CreateExpensePayload) {
  try {
    const result = await ExpenseService.createExpense(payload);
    revalidatePath('/');
    revalidatePath('/expenses');
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
