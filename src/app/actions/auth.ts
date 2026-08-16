'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users, familyMembers, families } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
      await db.insert(users).values({
        id: data.user.id,
        email: formData.email,
        name: formData.name,
      }).onConflictDoNothing();
    } catch (e) {
      console.error('Error syncing user record:', e);
    }
  }

  const requiresVerification = !data.session && !!data.user;

  revalidatePath('/', 'layout');
  return { success: true, requiresVerification, email: formData.email };
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

import { and } from 'drizzle-orm';

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
