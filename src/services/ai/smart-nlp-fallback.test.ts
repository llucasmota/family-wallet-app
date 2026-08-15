import { describe, it, expect } from 'vitest';
import { extractWithSmartNLP } from './smart-nlp-fallback';
import { FamilyContext } from './types';

const mockContext: FamilyContext = {
  currentDate: '2026-08-15',
  members: [
    { id: 'm1', name: 'Lucas Mota', role: 'admin' },
    { id: 'm2', name: 'Esposa', role: 'member' },
  ],
  categories: [
    { id: 'c1', name: 'Mercado & Feira' },
    { id: 'c2', name: 'Moradia & Contas Fixas' },
    { id: 'c3', name: 'Lazer & Restaurantes' },
    { id: 'c4', name: 'Transporte & Combustível' },
    { id: 'c5', name: 'Saúde & Farmácia' },
  ],
};

describe('Smart NLP Fallback Extractor', () => {
  it('should extract amount correctly without getting confused by percentage split', () => {
    const input = 'acabei de comprar r$ 20 em cerveja divisão será de 50% para 50%';
    const result = extractWithSmartNLP(input, mockContext, '2026-08-15');

    expect(result.amount).toBe(20.0);
    expect(result.description).toContain('Cerveja');
    expect(result.dueDate).toBe('2026-08-15');
    expect(result.categoryId).toBeDefined();
  });

  it('should extract decimal amounts and map to Moradia category', () => {
    const input = 'Conta de luz de 345,80 reais paga pelo Lucas';
    const result = extractWithSmartNLP(input, mockContext, '2026-08-15');

    expect(result.amount).toBe(345.8);
    expect(result.categoryId).toBe('c2'); // Moradia
    expect(result.payerMemberId).toBe('m1'); // Lucas Mota
  });

  it('should identify installments and extract installment count', () => {
    const input = 'Comprei pneus por R$ 1200 em 6x';
    const result = extractWithSmartNLP(input, mockContext, '2026-08-15');

    expect(result.amount).toBe(1200.0);
    expect(result.isInstallment).toBe(true);
    expect(result.totalInstallments).toBe(6);
  });

  it('should map health items to Health category', () => {
    const input = 'Remédios na farmácia R$ 85,00';
    const result = extractWithSmartNLP(input, mockContext, '2026-08-15');

    expect(result.amount).toBe(85.0);
    expect(result.categoryId).toBe('c5'); // Saúde
  });
});
