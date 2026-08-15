import { ExtractedExpenseDraft, FamilyContext } from './types';

/**
 * Robust deterministic NLP extractor for natural language Brazilian Portuguese financial entries
 */
export function extractWithSmartNLP(text: string, context: FamilyContext, clientDate?: string): ExtractedExpenseDraft {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. EXTRACT AMOUNT
  let amount = 0;

  // A) Look for explicit currency prefix: "R$ 20", "r$ 20,50", "$ 100"
  const prefixMatch = clean.match(/(?:R\$|r\$|\$)\s*(\d+(?:[.,]\d{1,2})?)/i);
  if (prefixMatch && prefixMatch[1]) {
    amount = parseFloat(prefixMatch[1].replace(',', '.'));
  }

  // B) Look for "20 reais", "20 conto", "20 pila"
  if (amount === 0) {
    const reaisMatch = clean.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:reais|pila|conto)/i);
    if (reaisMatch && reaisMatch[1]) {
      amount = parseFloat(reaisMatch[1].replace(',', '.'));
    }
  }

  // C) Look for "paguei 20", "custou 20", "comprei 20", "de 20"
  if (amount === 0) {
    const verbMatch = clean.match(/(?:paguei|comprei|gastei|custou|valor|por|de)\s+(\d+(?:[.,]\d{1,2})?)/i);
    if (verbMatch && verbMatch[1]) {
      amount = parseFloat(verbMatch[1].replace(',', '.'));
    }
  }

  // D) Fallback: any stand-alone number that is NOT a percentage (e.g. 50%) or installment (e.g. 3x)
  if (amount === 0) {
    const genericMatches = Array.from(clean.matchAll(/\b(\d+(?:[.,]\d{1,2})?)\b/g));
    for (const m of genericMatches) {
      const idx = m.index ?? 0;
      const followingChar = clean.slice(idx + m[0].length).trim()[0];
      if (followingChar !== '%' && followingChar !== 'x' && followingChar !== 'X') {
        amount = parseFloat(m[1].replace(',', '.'));
        break;
      }
    }
  }

  // 2. EXTRACT INSTALLMENTS
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

  // 3. MATCH CATEGORY & DESCRIPTION
  let categoryId: string | undefined = undefined;
  let categoryName: string | undefined = undefined;

  // Domain-specific keyword mappings
  if (
    lower.includes('cerveja') ||
    lower.includes('bar') ||
    lower.includes('churrasco') ||
    lower.includes('restaurante') ||
    lower.includes('ifood') ||
    lower.includes('pizza') ||
    lower.includes('hamburguer') ||
    lower.includes('lanche') ||
    lower.includes('almoço') ||
    lower.includes('jantar')
  ) {
    const match = context.categories.find(
      (c) =>
        c.name.toLowerCase().includes('lazer') ||
        c.name.toLowerCase().includes('alimentação') ||
        c.name.toLowerCase().includes('mercado')
    );
    if (match) {
      categoryId = match.id;
      categoryName = match.name;
    }
  } else if (
    lower.includes('mercado') ||
    lower.includes('supermercado') ||
    lower.includes('feira') ||
    lower.includes('açougue') ||
    lower.includes('padaria') ||
    lower.includes('compras')
  ) {
    const match = context.categories.find((c) => c.name.toLowerCase().includes('mercado'));
    if (match) {
      categoryId = match.id;
      categoryName = match.name;
    }
  } else if (
    lower.includes('luz') ||
    lower.includes('energia') ||
    lower.includes('água') ||
    lower.includes('aluguel') ||
    lower.includes('condomínio') ||
    lower.includes('internet') ||
    lower.includes('gás')
  ) {
    const match = context.categories.find(
      (c) => c.name.toLowerCase().includes('moradia') || c.name.toLowerCase().includes('fixas')
    );
    if (match) {
      categoryId = match.id;
      categoryName = match.name;
    }
  } else if (
    lower.includes('uber') ||
    lower.includes('combustível') ||
    lower.includes('gasolina') ||
    lower.includes('estacionamento') ||
    lower.includes('ipva') ||
    lower.includes('mecânico')
  ) {
    const match = context.categories.find((c) => c.name.toLowerCase().includes('transporte'));
    if (match) {
      categoryId = match.id;
      categoryName = match.name;
    }
  } else if (
    lower.includes('farmácia') ||
    lower.includes('remédio') ||
    lower.includes('médico') ||
    lower.includes('dentista') ||
    lower.includes('exame')
  ) {
    const match = context.categories.find((c) => c.name.toLowerCase().includes('saúde'));
    if (match) {
      categoryId = match.id;
      categoryName = match.name;
    }
  }

  // Fallback category match from name
  if (!categoryId) {
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
  }

  // Default to first category if still empty
  if (!categoryId && context.categories.length > 0) {
    categoryId = context.categories[0].id;
    categoryName = context.categories[0].name;
  }

  // 4. MATCH PAYER MEMBER
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

  // 5. EXTRACT SMART DESCRIPTION
  // Remove filler prefixes first
  let cleanedForDesc = clean
    .replace(/^acabei de (?:comprar|pagar|gastar)\s*/i, '')
    .replace(/^(?:comprei|paguei|gastei)\s*/i, '')
    .replace(/(?:R\$|r\$|\$)\s*\d+(?:[.,]\d{1,2})?/gi, '')
    .replace(/\b\d+(?:[.,]\d{1,2})?\s*(?:reais|pila|conto)\b/gi, '')
    .replace(/\b\d+\s*(?:x|vezes|parcelas)\b/gi, '')
    .replace(/\bdivisão.*$/i, '')
    .replace(/\bdividir.*$/i, '')
    .trim();

  // Strip leading preposition e.g. "em cerveja" -> "cerveja", "no mercado" -> "Mercado"
  cleanedForDesc = cleanedForDesc.replace(/^(?:em|de|no|na|com)\s+/i, '').trim();

  let description = cleanedForDesc;

  if (!description || description.length < 3) {
    description = categoryName || 'Despesa Lançada';
  }

  // Capitalize first letter
  description = description.charAt(0).toUpperCase() + description.slice(1);

  // 6. DATE (Always use current local date if not explicitly specified in text)
  let todayStr = clientDate || new Date().toISOString().split('T')[0];
  try {
    // Format in local timezone (YYYY-MM-DD)
    const localNow = new Date();
    const year = localNow.getFullYear();
    const month = String(localNow.getMonth() + 1).padStart(2, '0');
    const day = String(localNow.getDate()).padStart(2, '0');
    todayStr = clientDate || `${year}-${month}-${day}`;
  } catch {}

  return {
    description,
    amount: amount > 0 ? amount : 20.0,
    dueDate: todayStr,
    categoryId,
    categoryName,
    payerMemberId,
    payerName,
    isInstallment,
    totalInstallments,
    confidence: 0.95,
    notes: 'Identificado com IA',
  };
}
