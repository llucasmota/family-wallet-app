import { pgTable, uuid, text, numeric, timestamp, date, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const memberRoleEnum = pgEnum('member_role', ['admin', 'member', 'child']);
export const expenseStatusEnum = pgEnum('expense_status', ['pending', 'paid']);
export const expenseTypeEnum = pgEnum('expense_type', ['single', 'installment', 'recurring']);
export const recurrenceFrequencyEnum = pgEnum('recurrence_frequency', ['monthly', 'weekly', 'yearly']);

// 1. Users table (App Users)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 1.1 Beta Access Requests & Whitelist
export const betaAccessRequests = pgTable('beta_access_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  status: text('status').default('pending').notNull(), // 'pending' | 'approved' | 'rejected'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
});

// 2. Families (Multi-tenancy group)
export const families = pgTable('families', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  currency: text('currency').default('BRL').notNull(),
  createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Family Members (Role-based: husband, wife, child, etc.)
export const familyMembers = pgTable('family_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id').references(() => families.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  role: memberRoleEnum('role').default('member').notNull(),
  avatarKey: text('avatar_key').default('husband').notNull(), // 'husband' | 'wife' | 'child' | 'custom'
  color: text('color').default('#2E7D5E').notNull(), // Material 3 mint / theme color
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 4. Categories (Scoped per family or defaults)
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id').references(() => families.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon').default('Receipt').notNull(),
  color: text('color').default('#2E7D5E').notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 5. Installment Series (e.g. 12x of R$ 100)
export const installmentSeries = pgTable('installment_series', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id').references(() => families.id, { onDelete: 'cascade' }).notNull(),
  description: text('description').notNull(),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  totalInstallments: integer('total_installments').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 6. Recurrence Templates (Versioned recurring expenses like rent, subscriptions)
export const recurrenceTemplates = pgTable('recurrence_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id').references(() => families.id, { onDelete: 'cascade' }).notNull(),
  payerMemberId: uuid('payer_member_id').references(() => familyMembers.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }).notNull(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  frequency: recurrenceFrequencyEnum('frequency').default('monthly').notNull(),
  dayOfMonth: integer('day_of_month').default(1).notNull(),
  effectiveFrom: date('effective_from').notNull(),
  effectiveUntil: date('effective_until'), // Nullable if currently ongoing
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 7. Expenses (Core transactions)
export const expenses = pgTable('expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id').references(() => families.id, { onDelete: 'cascade' }).notNull(),
  payerMemberId: uuid('payer_member_id').references(() => familyMembers.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }).notNull(),
  installmentSeriesId: uuid('installment_series_id').references(() => installmentSeries.id, { onDelete: 'cascade' }),
  recurrenceTemplateId: uuid('recurrence_template_id').references(() => recurrenceTemplates.id, { onDelete: 'set null' }),
  
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  dueDate: date('due_date').notNull(),
  paymentDate: date('payment_date'),
  status: expenseStatusEnum('status').default('pending').notNull(),
  expenseType: expenseTypeEnum('expense_type').default('single').notNull(),
  
  installmentNumber: integer('installment_number'),
  totalInstallments: integer('total_installments'),
  
  notes: text('notes'),
  receiptUrl: text('receipt_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 8. Expense Splits (Division between members)
export const expenseSplits = pgTable('expense_splits', {
  id: uuid('id').defaultRandom().primaryKey(),
  expenseId: uuid('expense_id').references(() => expenses.id, { onDelete: 'cascade' }).notNull(),
  memberId: uuid('member_id').references(() => familyMembers.id, { onDelete: 'cascade' }).notNull(),
  percentage: numeric('percentage', { precision: 5, scale: 2 }).notNull(), // e.g. 50.00
  computedAmount: numeric('computed_amount', { precision: 12, scale: 2 }).notNull(),
  isSettled: boolean('is_settled').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 9. Settlements (Settlement transfers between family members)
export const settlements = pgTable('settlements', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id').references(() => families.id, { onDelete: 'cascade' }).notNull(),
  fromMemberId: uuid('from_member_id').references(() => familyMembers.id, { onDelete: 'cascade' }).notNull(),
  toMemberId: uuid('to_member_id').references(() => familyMembers.id, { onDelete: 'cascade' }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  settlementDate: date('settlement_date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const familiesRelations = relations(families, ({ many, one }) => ({
  members: many(familyMembers),
  categories: many(categories),
  expenses: many(expenses),
  createdByUser: one(users, {
    fields: [families.createdById],
    references: [users.id],
  }),
}));

export const familyMembersRelations = relations(familyMembers, ({ one, many }) => ({
  family: one(families, {
    fields: [familyMembers.familyId],
    references: [families.id],
  }),
  user: one(users, {
    fields: [familyMembers.userId],
    references: [users.id],
  }),
  paidExpenses: many(expenses),
  splits: many(expenseSplits),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  family: one(families, {
    fields: [categories.familyId],
    references: [families.id],
  }),
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  family: one(families, {
    fields: [expenses.familyId],
    references: [families.id],
  }),
  payer: one(familyMembers, {
    fields: [expenses.payerMemberId],
    references: [familyMembers.id],
  }),
  category: one(categories, {
    fields: [expenses.categoryId],
    references: [categories.id],
  }),
  installmentSeries: one(installmentSeries, {
    fields: [expenses.installmentSeriesId],
    references: [installmentSeries.id],
  }),
  recurrenceTemplate: one(recurrenceTemplates, {
    fields: [expenses.recurrenceTemplateId],
    references: [recurrenceTemplates.id],
  }),
  splits: many(expenseSplits),
}));

export const expenseSplitsRelations = relations(expenseSplits, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseSplits.expenseId],
    references: [expenses.id],
  }),
  member: one(familyMembers, {
    fields: [expenseSplits.memberId],
    references: [familyMembers.id],
  }),
}));
