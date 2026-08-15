import { db } from './index';
import {
  users,
  families,
  familyMembers,
  categories,
  expenses,
  expenseSplits,
  installmentSeries,
  recurrenceTemplates,
} from './schema';
import { DEFAULT_CATEGORIES } from './default-categories';
import { generateInstallmentSchedule } from '../services/expense-calculator';

async function seed() {
  console.log('🌱 Iniciando Seed do Family Wallet...');

  // 1. Create or Find User
  console.log('1. Criando Usuário Principal...');
  const [lucasUser] = await db
    .insert(users)
    .values({
      email: 'lucas@exemplo.com',
      name: 'Lucas Mota',
    })
    .onConflictDoNothing()
    .returning();

  const userId = lucasUser?.id;

  // 2. Create Family Group
  console.log('2. Criando Grupo Familiar...');
  const [family] = await db
    .insert(families)
    .values({
      name: 'Família Mota',
      currency: 'BRL',
      createdById: userId,
    })
    .returning();

  // 3. Create Family Members
  console.log('3. Criando Membros da Família (Esposo e Esposa)...');
  const [husband] = await db
    .insert(familyMembers)
    .values({
      familyId: family.id,
      userId: userId,
      displayName: 'Lucas Mota',
      role: 'admin',
      avatarKey: 'husband',
      color: '#1E6B52',
    })
    .returning();

  const [wife] = await db
    .insert(familyMembers)
    .values({
      familyId: family.id,
      displayName: 'Esposa',
      role: 'member',
      avatarKey: 'wife',
      color: '#3D6473',
    })
    .returning();

  // 4. Seed Default Categories
  console.log('4. Inserindo Categorias Padrão (Legadas & Essenciais)...');
  const createdCategories: Record<string, string> = {};

  for (const cat of DEFAULT_CATEGORIES) {
    const [inserted] = await db
      .insert(categories)
      .values({
        familyId: family.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        isDefault: true,
      })
      .returning();

    createdCategories[cat.name] = inserted.id;
  }

  // 5. Seed Sample Expenses
  console.log('5. Inserindo Lançamentos Iniciais com Divisões...');
  
  // Single Expense: Mercado (Pago pelo Lucas)
  const [mercadoExp] = await db
    .insert(expenses)
    .values({
      familyId: family.id,
      payerMemberId: husband.id,
      categoryId: createdCategories['Mercado & Feira'],
      description: 'Supermercado Mensal',
      amount: '680.50',
      dueDate: '2026-08-10',
      paymentDate: '2026-08-10',
      status: 'paid',
      expenseType: 'single',
    })
    .returning();

  await db.insert(expenseSplits).values([
    {
      expenseId: mercadoExp.id,
      memberId: husband.id,
      percentage: '50.00',
      computedAmount: '340.25',
      isSettled: false,
    },
    {
      expenseId: mercadoExp.id,
      memberId: wife.id,
      percentage: '50.00',
      computedAmount: '340.25',
      isSettled: false,
    },
  ]);

  // Installment Expense: Geladeira Inox (Paga pela Esposa em 10x)
  const instSchedule = generateInstallmentSchedule(
    'Geladeira Inox Nova',
    2899.0,
    10,
    '2026-06-15'
  );

  const [series] = await db
    .insert(installmentSeries)
    .values({
      familyId: family.id,
      description: 'Geladeira Inox Nova',
      totalAmount: '2899.00',
      totalInstallments: 10,
      startDate: instSchedule[0].dueDate,
      endDate: instSchedule[instSchedule.length - 1].dueDate,
    })
    .returning();

  for (const item of instSchedule) {
    const [instExp] = await db
      .insert(expenses)
      .values({
        familyId: family.id,
        payerMemberId: wife.id,
        categoryId: createdCategories['Consórcio & Financiamento'] || createdCategories['Outros / Diversos'],
        installmentSeriesId: series.id,
        description: item.description,
        amount: item.amount.toFixed(2),
        dueDate: item.dueDate,
        status: item.installmentNumber <= 3 ? 'paid' : 'pending',
        expenseType: 'installment',
        installmentNumber: item.installmentNumber,
        totalInstallments: 10,
      })
      .returning();

    await db.insert(expenseSplits).values([
      {
        expenseId: instExp.id,
        memberId: husband.id,
        percentage: '50.00',
        computedAmount: (item.amount / 2).toFixed(2),
        isSettled: false,
      },
      {
        expenseId: instExp.id,
        memberId: wife.id,
        percentage: '50.00',
        computedAmount: (item.amount / 2).toFixed(2),
        isSettled: false,
      },
    ]);
  }

  // Recurring Expense: Energia Elétrica
  const [recTemplate] = await db
    .insert(recurrenceTemplates)
    .values({
      familyId: family.id,
      payerMemberId: husband.id,
      categoryId: createdCategories['Energia & Água'],
      description: 'Conta de Energia Elétrica',
      amount: '215.40',
      frequency: 'monthly',
      dayOfMonth: 25,
      effectiveFrom: '2026-08-01',
      isActive: true,
    })
    .returning();

  const [recExp] = await db
    .insert(expenses)
    .values({
      familyId: family.id,
      payerMemberId: husband.id,
      categoryId: createdCategories['Energia & Água'],
      recurrenceTemplateId: recTemplate.id,
      description: 'Conta de Energia Elétrica',
      amount: '215.40',
      dueDate: '2026-08-25',
      status: 'pending',
      expenseType: 'recurring',
    })
    .returning();

  await db.insert(expenseSplits).values([
    {
      expenseId: recExp.id,
      memberId: husband.id,
      percentage: '50.00',
      computedAmount: '107.70',
      isSettled: false,
    },
    {
      expenseId: recExp.id,
      memberId: wife.id,
      percentage: '50.00',
      computedAmount: '107.70',
      isSettled: false,
    },
  ]);

  console.log('✅ Seed finalizado com sucesso no Supabase!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Erro durante o seed:', err);
  process.exit(1);
});
