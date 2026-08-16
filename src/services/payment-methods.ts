export type PaymentMethod = 'c6_card' | 'pix' | 'cash';

export interface PaymentMethodConfig {
  key: PaymentMethod;
  label: string;
  shortLabel: string;
  badgeLabel: string;
  iconName: string;
  color: string;
}

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    key: 'c6_card',
    label: 'Cartão de Crédito (C6 Bank)',
    shortLabel: 'C6 Bank',
    badgeLabel: '💳 C6 Bank',
    iconName: 'CreditCard',
    color: '#383838',
  },
  {
    key: 'pix',
    label: 'Pix / Débito',
    shortLabel: 'Pix',
    badgeLabel: '💠 Pix',
    iconName: 'Zap',
    color: '#00BDAE',
  },
  {
    key: 'cash',
    label: 'Dinheiro em Espécie',
    shortLabel: 'Dinheiro',
    badgeLabel: '💵 Dinheiro',
    iconName: 'Banknote',
    color: '#10B981',
  },
];

export function formatNotesWithPaymentMethod(paymentMethod: PaymentMethod = 'c6_card', notes?: string): string {
  const cleanNotes = (notes || '').replace(/\[PAYMENT:[a-z0-9_]+\]\s*/gi, '').trim();
  return `[PAYMENT:${paymentMethod}] ${cleanNotes}`.trim();
}

export function extractPaymentMethod(notes?: string | null): PaymentMethod {
  if (!notes) return 'c6_card'; // Default is C6 Bank card
  const match = notes.match(/\[PAYMENT:(c6_card|pix|cash)\]/i);
  if (match) return match[1].toLowerCase() as PaymentMethod;
  return 'c6_card';
}

export function extractCleanNotes(notes?: string | null): string {
  if (!notes) return '';
  return notes.replace(/\[PAYMENT:[a-z0-9_]+\]\s*/gi, '').trim();
}
