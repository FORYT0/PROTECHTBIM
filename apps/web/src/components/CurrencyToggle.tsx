import React, { useState, useRef, useEffect } from 'react';
import { useCurrency, CURRENCIES } from '../contexts/CurrencyContext';
import { RefreshCw } from 'lucide-react';

export function CurrencyToggle() {
  const { currency, setCurrency, ratesLoading, lastUpdated } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        title={`Currency: ${currency.code}`}
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all border
          ${open
            ? 'bg-blue-600 text-white border-blue-500'
            : 'bg-[#111] text-gray-300 border-gray-800 hover:border-gray-600 hover:text-white'
          }`}
      >
        <span className="text-sm leading-none">{currency.flag}</span>
        <span className="hidden sm:inline">{currency.code}</span>
        {ratesLoading && <RefreshCw className="w-3 h-3 animate-spin ml-0.5 opacity-60" />}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-[#0A0A0A] border border-gray-700 rounded-xl shadow-2xl shadow-black/60 z-[200] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-xs font-semibold text-white">Select Currency</p>
            {lastUpdated && (
              <p className="text-[10px] text-gray-500 mt-0.5">
                Rates updated {lastUpdated.toLocaleTimeString()}
              </p>
            )}
            {!lastUpdated && (
              <p className="text-[10px] text-gray-500 mt-0.5">Using fallback rates</p>
            )}
          </div>

          {/* Currency list */}
          <div className="max-h-72 overflow-y-auto py-1">
            {CURRENCIES.map(c => (
              <button
                key={c.code}
                onClick={() => { setCurrency(c); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                  ${c.code === currency.code
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-gray-300 hover:bg-[#111] hover:text-white'
                  }`}
              >
                <span className="text-lg leading-none w-6 text-center">{c.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{c.code}</span>
                    <span className="text-xs text-gray-500 font-mono">{c.symbol}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 truncate">{c.name}</p>
                </div>
                {c.code === currency.code && (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
