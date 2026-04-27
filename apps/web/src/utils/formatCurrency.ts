/**
 * Shared currency formatting — KES by default (Kenyan project).
 * Mirrors what useCurrency() hook does but usable outside React components.
 */

export const formatKES = (amount: number | string | null | undefined): string => {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat('en-KE', {
    style: 'currency', currency: 'KES', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);
};

export const formatUSD = (amount: number | string | null | undefined): string => {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);
};

export const formatNumber = (n: number | string | null | undefined, decimals = 0): string => {
  return Number(n || 0).toLocaleString('en-KE', {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  });
};
