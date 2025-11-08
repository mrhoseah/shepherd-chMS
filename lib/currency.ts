// Currency symbol mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  KES: "KSh",
  KSH: "KSh",
  ZAR: "R",
  NGN: "₦",
  GHS: "₵",
  UGX: "USh",
  TZS: "TSh",
  ETB: "Br",
  RWF: "RF",
  CAD: "C$",
  AUD: "A$",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
};

/**
 * Get currency settings (client-side compatible)
 * For client components, use the API endpoint /api/currency
 */
export function getCurrencySettings() {
  if (typeof window === "undefined") {
    // Server-side: return default (will be overridden by getCurrencyFromSettings from currency-server.ts)
    return { currency: "KES", currencySymbol: "KSh" };
  }

  const saved = localStorage.getItem("currency_settings");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return { currency: "KES", currencySymbol: "KSh" };
    }
  }

  return { currency: "KES", currencySymbol: "KSh" };
}

/**
 * Format currency amount with symbol
 * CLIENT-SIDE SAFE - no server dependencies
 */
export function formatCurrency(
  amount: number | string,
  currency?: string,
  currencySymbol?: string
): string {
  const settings = currency && currencySymbol
    ? { currency, currencySymbol }
    : getCurrencySettings();
  
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return `${settings.currencySymbol} 0.00`;
  }
  
  return `${settings.currencySymbol} ${numAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format currency without symbol
 */
export function formatCurrencyNoSymbol(amount: number | string): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return "0.00";
  }
  
  return numAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
