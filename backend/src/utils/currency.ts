/**
 * Currency conversion and exchange rate utility.
 * Base primary currency: INR (₹) - Indian Rupee.
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  rateToINR: number; // 1 Unit of Currency = X INR
}

export const CURRENCY_MAP: Record<string, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'INR - Indian Rupee', rateToINR: 1.0 },
  USD: { code: 'USD', symbol: '$', name: 'USD - US Dollar', rateToINR: 83.50 },
  EUR: { code: 'EUR', symbol: '€', name: 'EUR - Euro', rateToINR: 90.50 },
  GBP: { code: 'GBP', symbol: '£', name: 'GBP - British Pound', rateToINR: 106.00 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'CAD - Canadian Dollar', rateToINR: 61.20 },
  AED: { code: 'AED', symbol: 'د.إ', name: 'AED - UAE Dirham', rateToINR: 22.75 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'SGD - Singapore Dollar', rateToINR: 62.10 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'AUD - Australian Dollar', rateToINR: 54.80 },
  JPY: { code: 'JPY', symbol: '¥', name: 'JPY - Japanese Yen', rateToINR: 0.54 },
};

/**
 * Returns the exchange rate to INR for a given currency code. Defaults to 1.0 (INR).
 */
export function getExchangeRateToINR(currencyCode?: string): number {
  if (!currencyCode) return 1.0;
  const upper = currencyCode.toUpperCase();
  return CURRENCY_MAP[upper]?.rateToINR || 1.0;
}

/**
 * Converts any currency amount to INR.
 */
export function convertToINR(amount: number, currencyCode?: string): {
  currency: string;
  exchangeRate: number;
  amountINR: number;
} {
  const currency = (currencyCode || 'INR').toUpperCase();
  const exchangeRate = getExchangeRateToINR(currency);
  const amountINR = Math.round(amount * exchangeRate * 100) / 100;
  return {
    currency,
    exchangeRate,
    amountINR,
  };
}
