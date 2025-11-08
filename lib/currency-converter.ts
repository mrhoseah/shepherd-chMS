/**
 * Currency conversion utilities
 * Converts USD (internal storage) to user's display currency
 */

interface ExchangeRates {
  [currency: string]: number;
  timestamp: number;
}

// Cache exchange rates for 1 hour
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
let cachedRates: ExchangeRates | null = null;

/**
 * Fetch exchange rates from a free API
 * Using exchangerate-api.com (free tier: 1,500 requests/month)
 */
async function fetchExchangeRates(): Promise<ExchangeRates> {
  try {
    // Using exchangerate-api.com free tier (1,500 requests/month)
    // Alternative APIs: fixer.io, currencyapi.net, openexchangerates.org
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
      cache: "no-store", // Always fetch fresh rates (we handle caching ourselves)
    });

    if (!response.ok) {
      throw new Error("Failed to fetch exchange rates");
    }

    const data = await response.json();
    return {
      ...data.rates,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    // Return default rates if API fails
    return getDefaultRates();
  }
}

/**
 * Get default exchange rates (fallback if API fails)
 */
function getDefaultRates(): ExchangeRates {
  return {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    KES: 130,
    KSH: 130,
    ZAR: 18.5,
    NGN: 1500,
    GHS: 12.5,
    UGX: 3700,
    TZS: 2300,
    ETB: 55,
    RWF: 1300,
    CAD: 1.35,
    AUD: 1.52,
    JPY: 150,
    CNY: 7.2,
    INR: 83,
    timestamp: Date.now(),
  };
}

/**
 * Get exchange rate for a currency (with caching)
 */
export async function getExchangeRate(targetCurrency: string): Promise<number> {
  const currency = targetCurrency.toUpperCase();

  // Check cache
  if (
    cachedRates &&
    Date.now() - cachedRates.timestamp < CACHE_DURATION &&
    cachedRates[currency]
  ) {
    return cachedRates[currency];
  }

  // Fetch new rates
  const rates = await fetchExchangeRates();
  cachedRates = rates;

  return rates[currency] || 1; // Default to 1 if currency not found
}

/**
 * Convert USD amount to target currency
 */
export async function convertFromUSD(
  usdAmount: number,
  targetCurrency: string
): Promise<number> {
  if (targetCurrency.toUpperCase() === "USD") {
    return usdAmount;
  }

  const rate = await getExchangeRate(targetCurrency);
  return usdAmount * rate;
}

/**
 * Convert amount from target currency to USD (for storage)
 */
export async function convertToUSD(
  amount: number,
  sourceCurrency: string
): Promise<number> {
  if (sourceCurrency.toUpperCase() === "USD") {
    return amount;
  }

  const rate = await getExchangeRate(sourceCurrency);
  return amount / rate;
}

/**
 * Format currency with conversion (for display)
 * Internal storage is always USD, but display in user's currency
 */
export async function formatCurrencyWithConversion(
  usdAmount: number,
  displayCurrency: string,
  currencySymbol: string
): Promise<string> {
  const convertedAmount = await convertFromUSD(usdAmount, displayCurrency);

  return `${currencySymbol} ${convertedAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Synchronous version using cached rates (for client components)
 * Falls back to USD if rates not available
 */
export function formatCurrencyWithConversionSync(
  usdAmount: number,
  displayCurrency: string,
  currencySymbol: string,
  exchangeRate?: number
): string {
  if (displayCurrency.toUpperCase() === "USD" || !exchangeRate) {
    return `$${usdAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  const convertedAmount = usdAmount * exchangeRate;

  return `${currencySymbol} ${convertedAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

