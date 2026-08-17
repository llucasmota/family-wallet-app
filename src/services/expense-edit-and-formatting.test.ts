import { describe, it, expect } from 'vitest';
import { formatDateDisplay, formatCurrency } from '../lib/formatters';
import {
  extractPaymentMethod,
  formatNotesWithPaymentMethod,
  extractCleanNotes,
} from './payment-methods';
import { calculateNetSettlements } from './expense-calculator';

describe('Date and Currency Formatters (i18n)', () => {
  it('formats dates in Brazilian standard (DD/MM/YYYY) when locale is pt-BR', () => {
    expect(formatDateDisplay('2026-08-24', 'pt-BR')).toBe('24/08/2026');
    expect(formatDateDisplay('2026-01-05', 'pt-BR')).toBe('05/01/2026');
    expect(formatDateDisplay('2026-12-31', 'pt-BR')).toBe('31/12/2026');
  });

  it('formats dates in US standard (MM/DD/YYYY) when locale is en', () => {
    expect(formatDateDisplay('2026-08-24', 'en')).toBe('08/24/2026');
    expect(formatDateDisplay('2026-01-05', 'en')).toBe('01/05/2026');
  });

  it('handles empty or null dates gracefully', () => {
    expect(formatDateDisplay(null)).toBe('');
    expect(formatDateDisplay('')).toBe('');
    expect(formatDateDisplay(undefined)).toBe('');
  });

  it('formats BRL currency properly', () => {
    const formatted = formatCurrency(225.06, 'pt-BR', 'BRL');
    expect(formatted).toContain('225,06');
  });
});

describe('Payment Methods and Notes Extraction', () => {
  it('correctly encodes and extracts PIX payment method', () => {
    const notesWithPix = formatNotesWithPaymentMethod('pix', 'Comprovante conta de luz');
    expect(notesWithPix).toBe('[PAYMENT:pix] Comprovante conta de luz');

    const extracted = extractPaymentMethod(notesWithPix);
    expect(extracted).toBe('pix');

    const cleanNotes = extractCleanNotes(notesWithPix);
    expect(cleanNotes).toBe('Comprovante conta de luz');
  });

  it('correctly encodes and extracts Cash (Dinheiro) payment method', () => {
    const notesWithCash = formatNotesWithPaymentMethod('cash');
    expect(notesWithCash).toBe('[PAYMENT:cash]');

    const extracted = extractPaymentMethod(notesWithCash);
    expect(extracted).toBe('cash');
  });

  it('defaults to C6 Card when no payment tag exists', () => {
    expect(extractPaymentMethod(null)).toBe('c6_card');
    expect(extractPaymentMethod('')).toBe('c6_card');
    expect(extractPaymentMethod('Nota sem tag')).toBe('c6_card');
  });

  it('allows updating payment method while preserving other notes', () => {
    const initialNotes = formatNotesWithPaymentMethod('c6_card', 'Mercado mensal');
    expect(extractPaymentMethod(initialNotes)).toBe('c6_card');

    const updatedNotes = formatNotesWithPaymentMethod('pix', extractCleanNotes(initialNotes));
    expect(extractPaymentMethod(updatedNotes)).toBe('pix');
    expect(extractCleanNotes(updatedNotes)).toBe('Mercado mensal');
  });
});

describe('Split Ratio and Participation Calculations', () => {
  it('correctly calculates custom 40% / 60% split values', () => {
    const total = 225.06;
    const husbandPercent = 40;
    const wifePercent = 60;

    const husbandAmount = parseFloat(((total * husbandPercent) / 100).toFixed(2));
    const wifeAmount = parseFloat(((total * wifePercent) / 100).toFixed(2));

    expect(husbandAmount).toBe(90.02);
    expect(wifeAmount).toBe(135.04);
    expect(husbandAmount + wifeAmount).toBe(225.06);
  });

  it('correctly formats custom 40% / 60% dynamic split summary string', () => {
    const splits = [
      { memberId: 'm1', percentage: 40 },
      { memberId: 'm2', percentage: 60 },
    ];
    const summary = splits.map((s) => `${Math.round(s.percentage)}%`).join(' / ');
    expect(summary).toBe('40% / 60%');
  });

  it('correctly formats 100% / 0% individual expense split', () => {
    const splits = [{ memberId: 'm1', percentage: 100 }];
    const summary = splits.length === 1 && splits[0].percentage === 100
      ? '100% Individual'
      : splits.map((s) => `${Math.round(s.percentage)}%`).join(' / ');
    expect(summary).toBe('100% Individual');
  });
});

describe('Settlements, Transfers and Initial Credit Calculations', () => {
  it('calculates rent payment with subsequent bank transfer between spouses', () => {
    const husband = 'husband-id';
    const wife = 'wife-id';
    const members = [husband, wife];

    // Husband paid R$ 2000 rent, split 50% / 50%
    const paidExpenses = [
      {
        payerId: husband,
        splits: [
          { memberId: husband, computedAmount: 1000 },
          { memberId: wife, computedAmount: 1000 },
        ],
      },
    ];

    // Before transfer: wife owes husband R$ 1000
    const debtsBefore = calculateNetSettlements(members, paidExpenses, [], []);
    expect(debtsBefore).toEqual([
      { fromMemberId: wife, toMemberId: husband, amount: 1000 },
    ]);

    // Wife transfers R$ 1000 to husband to complete rent
    const settlements = [
      { fromMemberId: wife, toMemberId: husband, amount: 1000 },
    ];

    // After transfer: all settled!
    const debtsAfter = calculateNetSettlements(members, paidExpenses, [], settlements);
    expect(debtsAfter).toEqual([]);
  });

  it('handles partial transfer during the month', () => {
    const husband = 'husband-id';
    const wife = 'wife-id';
    const members = [husband, wife];

    // Husband paid R$ 2000 rent (wife share: 1000)
    const paidExpenses = [
      {
        payerId: husband,
        splits: [
          { memberId: husband, computedAmount: 1000 },
          { memberId: wife, computedAmount: 1000 },
        ],
      },
    ];

    // Wife transfers R$ 600 via PIX
    const settlements = [
      { fromMemberId: wife, toMemberId: husband, amount: 600 },
    ];

    // Wife still owes remainder R$ 400
    const debts = calculateNetSettlements(members, paidExpenses, [], settlements);
    expect(debts).toEqual([
      { fromMemberId: wife, toMemberId: husband, amount: 400 },
    ]);
  });

  it('handles initial starting credit prior to app usage', () => {
    const husband = 'husband-id';
    const wife = 'wife-id';
    const members = [husband, wife];

    // Wife starts with R$ 300 credit a favor (husband owes wife R$ 300)
    const initialCredits = [
      { creditorId: wife, debtorId: husband, amount: 300 },
    ];

    const debts = calculateNetSettlements(members, [], initialCredits, []);
    expect(debts).toEqual([
      { fromMemberId: husband, toMemberId: wife, amount: 300 },
    ]);
  });
});


