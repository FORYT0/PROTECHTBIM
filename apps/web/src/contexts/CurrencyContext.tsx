import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$',   name: 'US Dollar',       flag: '🇺🇸' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling',  flag: '🇰🇪' },
  { code: 'EUR', symbol: '€',   name: 'Euro',             flag: '🇪🇺' },
  { code: 'GBP', symbol: '£',   name: 'British Pound',    flag: '🇬🇧' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham',       flag: '🇦🇪' },
  { code: 'ZAR', symbol: 'R',   name: 'South African Rand', flag: '🇿🇦' },
  { code: 'NGN', symbol: '₦',   name: 'Nigerian Naira',   flag: '🇳🇬' },
  { code: 'GHS', symbol: '₵',   name: 'Ghanaian Cedi',    flag: '🇬🇭' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', flag: '🇹🇿' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', flag: '🇺🇬' },
];

// Fallback rates relative to USD (used when API is unavailable)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  KES: 129.5,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  ZAR: 18.6,
  NGN: 1580,
  GHS: 15.2,
  TZS: 2650,
  UGX: 3750,
};

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  rates: Record<string, number>;
  ratesLoading: boolean;
  lastUpdated: Date | null;
  /** Convert an amount from its source currency (default USD) to the selected currency */
  convert: (amount: number, fromCurrency?: string) => number;
  /** Format a number as currency string in the selected currency */
  formatCurrency: (amount: number, fromCurrency?: string) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = 'protecht_currency';

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const found = CURRENCIES.find(c => c.code === saved);
        if (found) return found;
      }
    } catch {}
    return CURRENCIES[0]; // USD default
  });

  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const fetchedRef = useRef(false);

  // Fetch live rates from open.er-api.com (free, no key needed)
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchRates = async () => {
      setRatesLoading(true);
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (res.ok) {
          const data = await res.json();
          if (data.rates) {
            setRates(data.rates);
            setLastUpdated(new Date());
          }
        }
      } catch {
        // silently fall back to hardcoded rates
      } finally {
        setRatesLoading(false);
      }
    };

    fetchRates();
    // Refresh every 30 minutes
    const interval = setInterval(fetchRates, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    try { localStorage.setItem(STORAGE_KEY, c.code); } catch {}
  }, []);

  const convert = useCallback((amount: number, fromCurrency = 'USD'): number => {
    if (fromCurrency === currency.code) return amount;
    // Convert to USD first, then to target
    const toUSD = fromCurrency === 'USD' ? amount : amount / (rates[fromCurrency] || 1);
    return toUSD * (rates[currency.code] || 1);
  }, [currency.code, rates]);

  const formatCurrency = useCallback((amount: number, fromCurrency = 'USD'): string => {
    const converted = convert(amount, fromCurrency);
    const cur = CURRENCIES.find(c => c.code === currency.code) || CURRENCIES[0];

    // Use Intl for proper formatting
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(converted);
    } catch {
      // Fallback for currencies Intl doesn't know
      return `${cur.symbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
  }, [convert, currency.code]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, ratesLoading, lastUpdated, convert, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
}
