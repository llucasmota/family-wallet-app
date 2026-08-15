import { db } from './index';
import { expenses, expenseSplits, installmentSeries, recurrenceTemplates, settlements } from './schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function clearExpenses() {
  console.log('🧹 Limpando todos os lançamentos e despesas de teste...');

  // Delete splits first due to foreign keys, then expenses, series, templates, and settlements
  await db.delete(expenseSplits);
  await db.delete(expenses);
  await db.delete(installmentSeries);
  await db.delete(recurrenceTemplates);
  await db.delete(settlements);

  console.log('✨ Sucesso! Todas as despesas foram zeradas. Família e Categorias continuam salvas!');
  process.exit(0);
}

clearExpenses().catch((err) => {
  console.error('❌ Erro ao limpar despesas:', err);
  process.exit(1);
});
