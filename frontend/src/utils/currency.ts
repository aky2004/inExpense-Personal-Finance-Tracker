/**
 * Currency and Exchange Rate Utilities for inExpense.
 * Primary base currency: INR (₹) - Indian Rupee.
 */

export interface CurrencyItem {
  code: string;
  symbol: string;
  name: string;
  rateToINR: number; // 1 Unit of Currency = X INR
}

export const CURRENCY_LIST: CurrencyItem[] = [
  { code: 'INR', symbol: '₹', name: 'INR - Indian Rupee (₹)', rateToINR: 1.0 },
  { code: 'USD', symbol: '$', name: 'USD - US Dollar ($)', rateToINR: 83.50 },
  { code: 'EUR', symbol: '€', name: 'EUR - Euro (€)', rateToINR: 90.50 },
  { code: 'GBP', symbol: '£', name: 'GBP - British Pound (£)', rateToINR: 106.00 },
  { code: 'CAD', symbol: 'C$', name: 'CAD - Canadian Dollar (C$)', rateToINR: 61.20 },
  { code: 'AED', symbol: 'د.إ', name: 'AED - UAE Dirham (د.إ)', rateToINR: 22.75 },
  { code: 'SGD', symbol: 'S$', name: 'SGD - Singapore Dollar (S$)', rateToINR: 62.10 },
  { code: 'AUD', symbol: 'A$', name: 'AUD - Australian Dollar (A$)', rateToINR: 54.80 },
  { code: 'JPY', symbol: '¥', name: 'JPY - Japanese Yen (¥)', rateToINR: 0.54 },
];

export const CURRENCY_MAP: Record<string, CurrencyItem> = CURRENCY_LIST.reduce(
  (acc, curr) => {
    acc[curr.code] = curr;
    return acc;
  },
  {} as Record<string, CurrencyItem>
);

/**
 * Get exchange rate to convert 1 unit of foreign currency into INR.
 */
export function getRateToINR(currencyCode?: string): number {
  if (!currencyCode) return 1.0;
  return CURRENCY_MAP[currencyCode.toUpperCase()]?.rateToINR || 1.0;
}

/**
 * Convert any amount in foreign currency to INR.
 */
export function convertToINR(amount: number, fromCurrency = 'INR'): number {
  const rate = getRateToINR(fromCurrency);
  return Math.round(amount * rate * 100) / 100;
}

/**
 * Format any number as Indian Rupee (e.g. ₹1,45,250.00).
 */
export function formatINR(amount: number, includeSymbol = true, decimals = 2): string {
  const num = Number(amount) || 0;
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return includeSymbol ? `₹${formatted}` : formatted;
}

/**
 * Format an amount in its native currency, with optional INR conversion equivalent.
 */
export function formatAmountWithCurrency(
  amount: number,
  currency = 'INR',
  options?: { showConvertedINR?: boolean }
): {
  formattedNative: string;
  symbol: string;
  convertedINR: number;
  formattedINR: string;
} {
  const code = (currency || 'INR').toUpperCase();
  const item = CURRENCY_MAP[code] || CURRENCY_MAP['INR'];
  const num = Number(amount) || 0;
  const symbol = item.symbol;

  const formattedNative = `${symbol}${num.toLocaleString(code === 'INR' ? 'en-IN' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const convertedINR = convertToINR(num, code);
  const formattedINR = formatINR(convertedINR, true, 2);

  return {
    formattedNative,
    symbol,
    convertedINR,
    formattedINR,
  };
}
