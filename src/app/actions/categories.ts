'use server';

import { db } from '@/db';
import { categories, families } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createCategoryAction(payload: {
  familyId: string;
  name: string;
  color: string;
  icon?: string;
}) {
  try {
    const [created] = await db
      .insert(categories)
      .values({
        familyId: payload.familyId,
        name: payload.name,
        color: payload.color || '#2E7D5E',
        icon: payload.icon || 'Receipt',
        isDefault: false,
      })
      .returning();

    revalidatePath('/');
    revalidatePath('/expenses');
    revalidatePath('/categories');

    return { success: true, category: created };
  } catch (error: any) {
    console.error('Error creating category:', error);
    return { success: false, error: error.message || 'Falha ao criar categoria' };
  }
}

export async function getCategoriesAction() {
  try {
    const [family] = await db.query.families.findMany({
      limit: 1,
      with: {
        categories: true,
      },
    });

    return { success: true, categories: family?.categories || [] };
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return { success: false, error: error.message };
  }
}
