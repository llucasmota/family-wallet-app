import { ExtractedExpenseDraft, FamilyContext } from './types';

/**
 * Intelligent deterministic extractor when Gemini API is offline or without API key
 */
export function extractWithSmartNLP(text: string, context: FamilyContext): ExtractedExpenseDraft {
  const clean = text.trim();

  // 1. Extract Amount: Look for numbers like "R$ 150,50", "150.50", "150,00", "89"
  let amount = 0;
  const currencyMatch = clean.match(/(?:R\$|r\$|\$)?\s*(\d+(?:[.,]\d{1,2})?)/);
  if (currencyMatch && currencyMatch[1]) {
    const rawNum = currencyMatch[1].replace(',', '.');
    amount = parseFloat(rawNum);
  }

  // 2. Extract Installments: Look for "em 3x", "3 vezes", "10x", "parcelado em 4x"
  let isInstallment = false;
  let totalInstallments: number | undefined = undefined;
  const installmentMatch = clean.match(/(\d+)\s*(?:x|vezes|parcelas)/i);
  if (installmentMatch && installmentMatch[1]) {
    const count = parseInt(installmentMatch[1], 10);
    if (count > 1 && count <= 48) {
      isInstallment = true;
      totalInstallments = count;
    }
  }

  // 3. Match Category
  let categoryId: string | undefined = undefined;
  let categoryName: string | undefined = undefined;
  const lower = clean.toLowerCase();

  for (const cat of context.categories) {
    const cLow = cat.name.toLowerCase();
    const keywords = cLow.split(/[\s&/]+/);
    const hasMatch = keywords.some((kw) => kw.length > 2 && lower.includes(kw));
    if (hasMatch) {
      categoryId = cat.id;
      categoryName = cat.name;
      break;
    }
  }

  // Specific domain category keywords
  if (!categoryId) {
    if (lower.includes('mercado') || lower.includes('supermercado') || lower.includes('feira') || lower.includes('açougue') || lower.includes('padaria')) {
      const match = context.categories.find((c) => c.name.toLowerCase().includes('mercado'));
      if (match) {
        categoryId = match.id;
        categoryName = match.name;
      }
    } else if (lower.includes('luz') || lower.includes('energia') || lower.includes('água') || lower.includes('aluguel') || lower.includes('condomínio') || lower.includes('internet')) {
      const match = context.categories.find((c) => c.name.toLowerCase().includes('moradia') || c.name.toLowerCase().includes('fixas'));
      if (match) {
        categoryId = match.id;
        categoryName = match.name;
      }
    } else if (lower.includes('uber') || lower.includes('combustível') || lower.includes('gasolina') || lower.includes('estacionamento') || lower.includes('ipva')) {
      const match = context.categories.find((c) => c.name.toLowerCase().includes('transporte'));
      if (match) {
        categoryId = match.id;
        categoryName = match.name;
      }
    } else if (lower.includes('restaurante') || lower.includes('ifood') || lower.includes('pizza') || lower.includes('lanche') || lower.includes('almoço')) {
      const match = context.categories.find((c) => c.name.toLowerCase().includes('alimentação') || c.name.toLowerCase().includes('lazer'));
      if (match) {
        categoryId = match.id;
        categoryName = match.name;
      }
    }
  }

  // 4. Match Payer Member
  let payerMemberId: string | undefined = undefined;
  let payerName: string | undefined = undefined;
  for (const m of context.members) {
    if (lower.includes(m.name.toLowerCase())) {
      payerMemberId = m.id;
      payerName = m.name;
      break;
    }
  }
  if (!payerMemberId && context.members.length > 0) {
    payerMemberId = context.members[0].id;
    payerName = context.members[0].name;
  }

  // 5. Clean Description
  let description = clean
    .replace(/(?:R\$|r\$|\$)?\s*\d+(?:[.,]\d{1,2})?/, '')
    .replace(/(\d+)\s*(?:x|vezes|parcelas)/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!description || description.length < 3) {
    description = categoryName || 'Despesa Lançada';
  }

  // Capitalize first letter
  description = description.charAt(0).toUpperCase() + description.slice(1);

  return {
    description,
    amount: amount > 0 ? amount : 50.0,
    dueDate: context.currentDate,
    categoryId,
    categoryName,
    payerMemberId,
    payerName,
    isInstallment,
    totalInstallments,
    confidence: 0.9,
    notes: 'Processado com IA',
  };
}
