/**
 * Utility functions for locale-aware date and currency formatting across Family Wallet.
 */

export function formatDateDisplay(dateStr?: string | null, locale: string = 'pt-BR'): string {
  if (!dateStr) return '';
  try {
    const cleanDate = dateStr.split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      if (locale === 'en') {
        return `${month}/${day}/${year}`;
      }
      // Standard Brazilian format DD/MM/YYYY
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  } catch {
    return dateStr || '';
  }
}

export function formatCurrency(amount: number, locale: string = 'pt-BR', currency: string = 'BRL'): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'pt-BR', {
    style: 'currency',
    currency: locale === 'en' ? 'USD' : currency || 'BRL',
  }).format(amount);
}
