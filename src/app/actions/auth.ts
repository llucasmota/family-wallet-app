'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users, familyMembers, families, betaAccessRequests } from '@/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function ensureBetaTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS beta_access_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        approved_at TIMESTAMPTZ
      );
    `);
  } catch {}
}

export async function signInAction(formData: { email: string; password: string }) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function signUpAction(formData: { email: string; password: string; name: string }) {
  await ensureBetaTable();
  const normalizedEmail = formData.email.trim().toLowerCase();

  // 1. Beta Whitelist Gate: Check if user is allowed to signup
  try {
    const existingUsers = await db.query.users.findMany({ limit: 2 });

    // If there is already at least 1 user (system is running), enforce beta approval
    if (existingUsers.length > 0) {
      const isAlreadyRegistered = existingUsers.some(
        (u) => u.email.toLowerCase() === normalizedEmail
      );

      if (!isAlreadyRegistered) {
        const betaReq = await db.query.betaAccessRequests.findFirst({
          where: eq(betaAccessRequests.email, normalizedEmail),
        });

        if (!betaReq || betaReq.status !== 'approved') {
          // Record or ensure pending request exists
          if (!betaReq) {
            try {
              await db.insert(betaAccessRequests).values({
                email: normalizedEmail,
                name: formData.name.trim() || 'Usuário Beta',
                status: 'pending',
              });
            } catch {}
          }

          return {
            success: false,
            isBetaPending: true,
            email: normalizedEmail,
            error:
              'Aplicativo em fase Beta Restrita. Sua solicitação de acesso foi enviada ao administrador e está aguardando aprovação prévia.',
          };
        }
      }
    }
  } catch (e) {
    console.error('Error checking beta access:', e);
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        display_name: formData.name,
      },
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // If user registered, make sure they have a record in `users` table
  if (data.user) {
    try {
      await db
        .insert(users)
        .values({
          id: data.user.id,
          email: formData.email,
          name: formData.name,
        })
        .onConflictDoNothing();
    } catch (e) {
      console.error('Error syncing user record:', e);
    }
  }

  const requiresVerification = !data.session && !!data.user;

  revalidatePath('/', 'layout');
  return { success: true, requiresVerification, email: formData.email };
}

export async function getBetaRequestsAction() {
  await ensureBetaTable();
  try {
    const requests = await db.query.betaAccessRequests.findMany({
      orderBy: [desc(betaAccessRequests.createdAt)],
    });
    return { success: true, requests };
  } catch (err: any) {
    return { success: false, error: err.message, requests: [] };
  }
}

export async function approveBetaRequestAction(requestId: string) {
  await ensureBetaTable();
  try {
    await db
      .update(betaAccessRequests)
      .set({
        status: 'approved',
        approvedAt: new Date(),
      })
      .where(eq(betaAccessRequests.id, requestId));

    revalidatePath('/family');
    return { success: true, message: '✨ Acesso aprovado com sucesso! O usuário já pode criar o login.' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function rejectBetaRequestAction(requestId: string) {
  await ensureBetaTable();
  try {
    await db
      .update(betaAccessRequests)
      .set({
        status: 'rejected',
      })
      .where(eq(betaAccessRequests.id, requestId));

    revalidatePath('/family');
    return { success: true, message: 'Solicitação rejeitada.' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteBetaRequestAction(requestId: string) {
  await ensureBetaTable();
  try {
    await db
      .delete(betaAccessRequests)
      .where(eq(betaAccessRequests.id, requestId));

    revalidatePath('/family');
    return { success: true, message: 'Solicitação excluída com sucesso.' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function resetPasswordAction(email: string) {
  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/auth/reset-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updatePasswordAction(newPassword: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/auth');
}

export async function signUpAndJoinFamilyAction(payload: {
  familyId: string;
  email: string;
  password: string;
  displayName: string;
  avatarKey: string;
  role?: 'member' | 'child';
}) {
  await ensureBetaTable();
  const supabase = await createClient();
  const normalizedEmail = payload.email.trim().toLowerCase();
  const assignedRole = payload.role || 'member';
  const color = payload.avatarKey === 'wife' ? '#3D6473' : payload.avatarKey === 'child' ? '#FF9800' : '#1E6B52';

  // 1. Pre-approve in beta access requests since they are joining via a valid family invite link
  try {
    const existingReq = await db.query.betaAccessRequests.findFirst({
      where: eq(betaAccessRequests.email, normalizedEmail),
    });
    if (!existingReq) {
      await db.insert(betaAccessRequests).values({
        email: normalizedEmail,
        name: payload.displayName.trim() || 'Membro Convidado',
        status: 'approved',
        approvedAt: new Date(),
      });
    } else if (existingReq.status !== 'approved') {
      await db
        .update(betaAccessRequests)
        .set({
          status: 'approved',
          approvedAt: new Date(),
        })
        .where(eq(betaAccessRequests.id, existingReq.id));
    }
  } catch (e) {
    console.error('Error pre-approving invited member in beta:', e);
  }

  // 2. Sign up user in Supabase Auth
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: payload.password,
    options: {
      data: {
        display_name: payload.displayName.trim(),
      },
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    // If user is already registered in Auth, attempt login with the provided credentials
    if (error.message.includes('User already registered')) {
      const signInRes = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: payload.password,
      });

      if (signInRes.error) {
        return {
          success: false,
          error: 'Este e-mail já possui cadastro. A senha informada está incorreta.',
        };
      }

      // User logged in successfully, link them to the family
      if (signInRes.data.user) {
        return await linkUserToFamily({
          userId: signInRes.data.user.id,
          familyId: payload.familyId,
          displayName: payload.displayName,
          avatarKey: payload.avatarKey,
          color,
          role: assignedRole,
        });
      }
    }

    return { success: false, error: error.message };
  }

  if (data.user) {
    // Ensure public.users record exists
    try {
      await db
        .insert(users)
        .values({
          id: data.user.id,
          email: normalizedEmail,
          name: payload.displayName.trim(),
        })
        .onConflictDoNothing();
    } catch (e) {}

    // Link user as a member of the family
    return await linkUserToFamily({
      userId: data.user.id,
      familyId: payload.familyId,
      displayName: payload.displayName,
      avatarKey: payload.avatarKey,
      color,
      role: assignedRole,
    });
  }

  return { success: true };
}

async function linkUserToFamily(params: {
  userId: string;
  familyId: string;
  displayName: string;
  avatarKey: string;
  color: string;
  role: 'member' | 'child';
}) {
  // Check if member exists for this user in this family
  const existingMember = await db.query.familyMembers.findFirst({
    where: and(
      eq(familyMembers.familyId, params.familyId),
      eq(familyMembers.userId, params.userId)
    ),
  });

  if (existingMember) {
    const [updated] = await db
      .update(familyMembers)
      .set({
        displayName: params.displayName.trim(),
        avatarKey: params.avatarKey,
        color: params.color,
        role: params.role,
        isActive: true,
      })
      .where(eq(familyMembers.id, existingMember.id))
      .returning();

    revalidatePath('/', 'layout');
    return { success: true, member: updated };
  }

  // Create new member with role 'member'
  const [created] = await db
    .insert(familyMembers)
    .values({
      familyId: params.familyId,
      userId: params.userId,
      displayName: params.displayName.trim(),
      avatarKey: params.avatarKey,
      color: params.color,
      role: params.role,
      isActive: true,
    })
    .returning();

  revalidatePath('/', 'layout');
  return { success: true, member: created };
}

export async function joinFamilyAction(payload: {
  familyId: string;
  displayName: string;
  avatarKey: string;
  role: 'admin' | 'member' | 'child';
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    const color = payload.avatarKey === 'wife' ? '#3D6473' : payload.avatarKey === 'child' ? '#FF9800' : '#1E6B52';

    // 1. Check if this authenticated user already has a member profile in this family
    if (user?.id) {
      const existingUserMember = await db.query.familyMembers.findFirst({
        where: and(
          eq(familyMembers.familyId, payload.familyId),
          eq(familyMembers.userId, user.id)
        ),
      });

      if (existingUserMember) {
        const [updated] = await db
          .update(familyMembers)
          .set({
            displayName: payload.displayName.trim() || existingUserMember.displayName,
            role: payload.role,
            avatarKey: payload.avatarKey,
            color,
            isActive: true,
          })
          .where(eq(familyMembers.id, existingUserMember.id))
          .returning();

        revalidatePath('/family');
        revalidatePath('/');
        return { success: true, member: updated };
      }
    }

    // 2. Check if an unlinked member exists with matching name in this family
    const existingByName = await db.query.familyMembers.findFirst({
      where: and(
        eq(familyMembers.familyId, payload.familyId),
        eq(familyMembers.displayName, payload.displayName.trim())
      ),
    });

    if (existingByName) {
      const [updated] = await db
        .update(familyMembers)
        .set({
          userId: user?.id || existingByName.userId,
          role: payload.role,
          avatarKey: payload.avatarKey,
          color,
          isActive: true,
        })
        .where(eq(familyMembers.id, existingByName.id))
        .returning();

      revalidatePath('/family');
      revalidatePath('/');
      return { success: true, member: updated };
    }

    // 3. Otherwise, create a clean new member
    const [createdMember] = await db.insert(familyMembers).values({
      familyId: payload.familyId,
      userId: user?.id || null,
      displayName: payload.displayName.trim(),
      role: payload.role,
      avatarKey: payload.avatarKey,
      color,
      isActive: true,
    }).returning();

    revalidatePath('/family');
    revalidatePath('/');
    return { success: true, member: createdMember };
  } catch (error: any) {
    console.error('Error joining family:', error);
    return { success: false, error: error.message || 'Falha ao ingressar na família' };
  }
}
