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
    redirectTo: `${appUrl}/auth/reset-password`,
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

export async function joinFamilyAction(payload: {
  familyId: string;
  displayName: string;
  avatarKey: string;
  role: 'admin' | 'member' | 'child';
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    const [createdMember] = await db.insert(familyMembers).values({
      familyId: payload.familyId,
      userId: user?.id || null,
      displayName: payload.displayName,
      role: payload.role,
      avatarKey: payload.avatarKey,
      color: payload.avatarKey === 'wife' ? '#3D6473' : payload.avatarKey === 'child' ? '#FF9800' : '#1E6B52',
    }).returning();

    revalidatePath('/family');
    revalidatePath('/');
    return { success: true, member: createdMember };
  } catch (error: any) {
    console.error('Error joining family:', error);
    return { success: false, error: error.message || 'Falha ao ingressar na família' };
  }
}
