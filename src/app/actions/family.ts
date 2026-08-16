'use server';

import { db } from '@/db';
import { families, familyMembers, categories, expenses, expenseSplits, settlements, users } from '@/db/schema';
import { eq, and, desc, sql, or } from 'drizzle-orm';
import { calculateNetSettlements } from '@/services/expense-calculator';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_CATEGORIES } from '@/db/default-categories';

export async function getFamilyDataAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Self-healing migration for is_active column
    try {
      await db.execute(sql`ALTER TABLE family_members ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;`);
    } catch {}

    // Ensure user row exists in public.users to prevent foreign key errors
    if (user) {
      try {
        await db
          .insert(users)
          .values({
            id: user.id,
            email: user.email || 'user@familywallet.com',
            name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuário',
          })
          .onConflictDoNothing();
      } catch (e) {
        console.error('Error ensuring user row in public.users:', e);
      }
    }

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
        isActive: true,
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
        isActive: true,
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
    let targetFamilyId = payload.familyId;
    if (!targetFamilyId || !targetFamilyId.includes('-')) {
      const [firstFam] = await db.query.families.findMany({ limit: 1 });
      if (firstFam) targetFamilyId = firstFam.id;
    }

    const [created] = await db
      .insert(familyMembers)
      .values({
        familyId: targetFamilyId,
        displayName: payload.displayName.trim() || 'Novo Membro',
        avatarKey: payload.avatarKey || 'husband',
        color: payload.color || '#1E6B52',
        role: payload.role || 'member',
        isActive: true,
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

/**
 * Smart delete: if member has 0 operations, performs permanent hard delete.
 * If member has operations/history, performs soft delete (inactivation).
 */
export async function deleteOrInactivateMemberAction(memberId: string) {
  try {
    const member = await db.query.familyMembers.findFirst({
      where: eq(familyMembers.id, memberId),
    });

    if (!member) {
      return { success: false, error: 'Membro não encontrado' };
    }

    // Check operations count
    const [payerExpenses, splitsCount, settlementCount] = await Promise.all([
      db.query.expenses.findMany({
        where: eq(expenses.payerMemberId, memberId),
        limit: 1,
      }),
      db.query.expenseSplits.findMany({
        where: eq(expenseSplits.memberId, memberId),
        limit: 1,
      }),
      db.query.settlements.findMany({
        where: or(
          eq(settlements.fromMemberId, memberId),
          eq(settlements.toMemberId, memberId)
        ),
        limit: 1,
      }),
    ]);

    const hasHistory = payerExpenses.length > 0 || splitsCount.length > 0 || settlementCount.length > 0;

    if (!hasHistory) {
      // 0 operations -> Clean Hard Delete
      await db.delete(familyMembers).where(eq(familyMembers.id, memberId));
      revalidatePath('/family');
      revalidatePath('/');
      revalidatePath('/expenses');
      return {
        success: true,
        action: 'deleted',
        message: 'Membro excluído definitivamente com sucesso!',
      };
    } else {
      // Has history -> Soft Delete / Inactivation
      await db
        .update(familyMembers)
        .set({ isActive: false })
        .where(eq(familyMembers.id, memberId));

      revalidatePath('/family');
      revalidatePath('/');
      revalidatePath('/expenses');
      return {
        success: true,
        action: 'inactivated',
        message: 'Membro inativado com sucesso! O histórico e os rateios passados foram preservados.',
      };
    }
  } catch (error: any) {
    console.error('Error in deleteOrInactivateMemberAction:', error);
    return { success: false, error: error.message || 'Falha ao processar exclusão/inativação do membro' };
  }
}

export async function reactivateMemberAction(memberId: string) {
  try {
    await db
      .update(familyMembers)
      .set({ isActive: true })
      .where(eq(familyMembers.id, memberId));

    revalidatePath('/family');
    revalidatePath('/');
    revalidatePath('/expenses');
    return { success: true, message: 'Membro reativado com sucesso!' };
  } catch (error: any) {
    console.error('Error reactivating member:', error);
    return { success: false, error: error.message || 'Falha ao reativar membro' };
  }
}

export async function deleteMemberAction(memberId: string) {
  return await deleteOrInactivateMemberAction(memberId);
}

export async function recordSettlementAction(payload: {
  familyId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  note?: string;
}) {
  try {
    let targetFamilyId = payload.familyId;
    if (!targetFamilyId || !targetFamilyId.includes('-')) {
      const [firstFam] = await db.query.families.findMany({ limit: 1 });
      if (firstFam) targetFamilyId = firstFam.id;
    }

    let fromId = payload.fromMemberId;
    let toId = payload.toMemberId;
    const members = await db.query.familyMembers.findMany({
      where: eq(familyMembers.familyId, targetFamilyId),
    });

    if (!fromId || !fromId.includes('-')) {
      if (members[0]) fromId = members[0].id;
    }
    if (!toId || !toId.includes('-')) {
      if (members[1]) toId = members[1].id;
      else if (members[0]) toId = members[0].id;
    }

    const [settlement] = await db
      .insert(settlements)
      .values({
        familyId: targetFamilyId,
        fromMemberId: fromId,
        toMemberId: toId,
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
    let targetFamilyId = payload.familyId;
    if (!targetFamilyId || !targetFamilyId.includes('-')) {
      const [firstFam] = await db.query.families.findMany({ limit: 1 });
      if (firstFam) targetFamilyId = firstFam.id;
    }

    const [updated] = await db
      .update(families)
      .set({
        name: payload.name,
        currency: payload.currency || 'BRL',
      })
      .where(eq(families.id, targetFamilyId))
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
    let targetId = payload.memberId;
    if (!targetId || !targetId.includes('-')) {
      const [first] = await db.query.familyMembers.findMany({ limit: 1 });
      if (first) targetId = first.id;
    }

    const [updated] = await db
      .update(familyMembers)
      .set({
        displayName: payload.displayName,
        avatarKey: payload.avatarKey,
        color: payload.color || '#2E7D5E',
        ...(payload.role ? { role: payload.role } : {}),
      })
      .where(eq(familyMembers.id, targetId))
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

export async function resetFamilyDataAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuário não autenticado.' };
  }

  try {
    const [family] = await db.query.families.findMany({
      limit: 1,
      with: {
        members: true,
      },
    });

    if (!family) {
      return { success: false, error: 'Família não encontrada.' };
    }

    // 1. Clear all expenses, splits and settlements
    await db.delete(expenseSplits);
    await db.delete(expenses);
    await db.delete(settlements);

    // 2. Identify the admin member for lucas.o.mota@gmail.com
    const adminMember =
      family.members.find((m) => m.userId === user.id) ||
      family.members.find((m) => m.role === 'admin') ||
      family.members[0];

    if (adminMember) {
      // Ensure admin member is active and has correct userId
      await db
        .update(familyMembers)
        .set({
          userId: user.id,
          role: 'admin',
          isActive: true,
        })
        .where(eq(familyMembers.id, adminMember.id));

      // Remove all other duplicate family members
      await db
        .delete(familyMembers)
        .where(
          and(
            eq(familyMembers.familyId, family.id),
            sql`${familyMembers.id} != ${adminMember.id}`
          )
        );
    }

    revalidatePath('/');
    revalidatePath('/expenses');
    revalidatePath('/family');
    revalidatePath('/categories');

    return {
      success: true,
      message: '✨ Dados de teste limpos com sucesso! Apenas seu usuário foi mantido no grupo.',
    };
  } catch (err: any) {
    console.error('Error resetting family data:', err);
    return { success: false, error: err.message || 'Erro ao limpar dados de teste' };
  }
}
