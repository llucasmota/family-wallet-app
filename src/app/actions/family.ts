'use server';

import { db } from '@/db';
import { families, familyMembers, categories, expenses, expenseSplits, settlements } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { calculateNetSettlements } from '@/services/expense-calculator';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_CATEGORIES } from '@/db/default-categories';

export async function getFamilyDataAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Get first active family
    let [family] = await db.query.families.findMany({
      limit: 1,
      with: {
        members: true,
        categories: true,
      },
    });

    // Auto-create family if none exists
    if (!family) {
      const [newFam] = await db
        .insert(families)
        .values({
          name: 'Minha Família',
          currency: 'BRL',
          createdById: user?.id || null,
        })
        .returning();

      // Seed 12 default categories
      for (const cat of DEFAULT_CATEGORIES) {
        await db.insert(categories).values({
          familyId: newFam.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          isDefault: true,
        });
      }

      // Create first member for the logged in user
      await db.insert(familyMembers).values({
        familyId: newFam.id,
        userId: user?.id || null,
        displayName: user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Administrador',
        role: 'admin',
        avatarKey: 'husband',
        color: '#1E6B52',
      });

      const [reloaded] = await db.query.families.findMany({
        where: eq(families.id, newFam.id),
        with: {
          members: true,
          categories: true,
        },
      });
      family = reloaded;
    } else if (family.members.length === 0) {
      // If family exists but has 0 members, create the admin member
      await db.insert(familyMembers).values({
        familyId: family.id,
        userId: user?.id || null,
        displayName: user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Administrador',
        role: 'admin',
        avatarKey: 'husband',
        color: '#1E6B52',
      });

      const [reloaded] = await db.query.families.findMany({
        where: eq(families.id, family.id),
        with: {
          members: true,
          categories: true,
        },
      });
      family = reloaded;
    }

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
      family,
      settlements: formattedDebts,
    };
  } catch (error: any) {
    console.error('Error in getFamilyDataAction:', error);
    return { success: false, error: error.message || 'Falha ao carregar dados da família' };
  }
}

export async function addMemberAction(payload: {
  familyId: string;
  displayName: string;
  avatarKey: string;
  color?: string;
  role?: 'admin' | 'member' | 'child';
}) {
  try {
    const [created] = await db
      .insert(familyMembers)
      .values({
        familyId: payload.familyId,
        displayName: payload.displayName,
        avatarKey: payload.avatarKey,
        color: payload.color || '#1E6B52',
        role: payload.role || 'member',
      })
      .returning();

    revalidatePath('/family');
    revalidatePath('/');
    revalidatePath('/expenses');
    return { success: true, member: created };
  } catch (error: any) {
    console.error('Error adding member:', error);
    return { success: false, error: error.message || 'Falha ao adicionar membro' };
  }
}

export async function deleteMemberAction(memberId: string) {
  try {
    await db.delete(familyMembers).where(eq(familyMembers.id, memberId));
    revalidatePath('/family');
    revalidatePath('/');
    revalidatePath('/expenses');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting member:', error);
    return { success: false, error: error.message || 'Falha ao excluir membro' };
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
    const [settlement] = await db
      .insert(settlements)
      .values({
        familyId: payload.familyId,
        fromMemberId: payload.fromMemberId,
        toMemberId: payload.toMemberId,
        amount: payload.amount.toString(),
        settlementDate: new Date().toISOString().split('T')[0],
        notes: payload.note || 'Acerto de contas entre membros',
      })
      .returning();

    revalidatePath('/family');
    revalidatePath('/');
    return { success: true, settlement };
  } catch (error: any) {
    console.error('Error recording settlement:', error);
    return { success: false, error: error.message || 'Falha ao registrar acerto' };
  }
}

export async function updateFamilySettingsAction(payload: {
  familyId: string;
  name: string;
  currency?: string;
}) {
  try {
    const [updated] = await db
      .update(families)
      .set({
        name: payload.name,
        currency: payload.currency || 'BRL',
      })
      .where(eq(families.id, payload.familyId))
      .returning();

    revalidatePath('/family');
    revalidatePath('/');
    return { success: true, family: updated };
  } catch (error: any) {
    console.error('Error updating family settings:', error);
    return { success: false, error: error.message || 'Falha ao atualizar grupo familiar' };
  }
}

export async function updateMemberProfileAction(payload: {
  memberId: string;
  displayName: string;
  avatarKey: string;
  color?: string;
  role?: 'admin' | 'member' | 'child';
}) {
  try {
    const [updated] = await db
      .update(familyMembers)
      .set({
        displayName: payload.displayName,
        avatarKey: payload.avatarKey,
        color: payload.color || '#2E7D5E',
        ...(payload.role ? { role: payload.role } : {}),
      })
      .where(eq(familyMembers.id, payload.memberId))
      .returning();

    revalidatePath('/family');
    revalidatePath('/');
    revalidatePath('/expenses');
    return { success: true, member: updated };
  } catch (error: any) {
    console.error('Error updating member profile:', error);
    return { success: false, error: error.message || 'Falha ao atualizar perfil do membro' };
  }
}

export async function updateFamilyCurrencyWithConversionAction(payload: {
  familyId: string;
  newCurrency: string;
  mode: 'nominal' | 'convert_rate';
  exchangeRate?: number;
}) {
  try {
    return await db.transaction(async (tx) => {
      // 1. Update family currency
      await tx
        .update(families)
        .set({ currency: payload.newCurrency })
        .where(eq(families.id, payload.familyId));

      // 2. If convert_rate is selected, adjust historical records
      if (payload.mode === 'convert_rate' && payload.exchangeRate && payload.exchangeRate > 0) {
        const rate = payload.exchangeRate;

        // Convert expenses and splits
        const familyExpenses = await tx.query.expenses.findMany({
          where: eq(expenses.familyId, payload.familyId),
          with: { splits: true },
        });

        for (const exp of familyExpenses) {
          const newTotal = (parseFloat(exp.amount) * rate).toFixed(2);
          await tx.update(expenses).set({ amount: newTotal }).where(eq(expenses.id, exp.id));

          for (const split of exp.splits) {
            const newSplitAmount = (parseFloat(split.computedAmount) * rate).toFixed(2);
            await tx
              .update(expenseSplits)
              .set({ computedAmount: newSplitAmount })
              .where(eq(expenseSplits.id, split.id));
          }
        }

        // Convert settlements
        const familySettlements = await tx.query.settlements.findMany({
          where: eq(settlements.familyId, payload.familyId),
        });

        for (const set of familySettlements) {
          const newSetAmount = (parseFloat(set.amount) * rate).toFixed(2);
          await tx
            .update(settlements)
            .set({ amount: newSetAmount })
            .where(eq(settlements.id, set.id));
        }
      }

      revalidatePath('/');
      revalidatePath('/expenses');
      revalidatePath('/family');
      return { success: true };
    });
  } catch (error: any) {
    console.error('Error updating currency with conversion:', error);
    return { success: false, error: error.message || 'Falha ao atualizar moeda do grupo' };
  }
}
