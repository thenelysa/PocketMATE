/** Display formatting. Pure functions — no React, no domain knowledge. */

const currencySymbols: Record<string, string> = {
  USD: '$',
  NPR: 'रू',
};

/** `84.2` -> `"$84.20"` or `"रू 84.20"` depending on currency. Accepts a string because JSON numbers may arrive as one. */
export const money = (value: number | string, currency = 'USD') => {
  const symbol = currencySymbols[currency] || '$';
  return `${symbol}${Number(value).toFixed(2)}`;
};

/**
 * Day of month as an ordinal: 1st, 2nd, 3rd, 4th …
 * 11th/12th/13th are the exceptions to the last-digit rule.
 */
export function ordinal(day: number): string {
  const suffix =
    day % 100 >= 11 && day % 100 <= 13
      ? 'th'
      : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[day % 10] ?? 'th';
  return `${day}${suffix}`;
}
