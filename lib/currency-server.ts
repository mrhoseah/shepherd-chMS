import { prisma } from "./prisma";

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
 * Get currency settings from database (Church model)
 * Falls back to default if not available
 * SERVER-SIDE ONLY - uses Prisma
 */
export async function getCurrencyFromSettings(): Promise<{
  currency: string;
  currencySymbol: string;
}> {
  try {
    // Get the first active church (assuming single church setup)
    const church = await prisma.church.findFirst({
      where: { isActive: true },
      select: { currency: true },
    });

    if (church?.currency) {
      const symbol = CURRENCY_SYMBOLS[church.currency.toUpperCase()] || church.currency;
      return {
        currency: church.currency.toUpperCase(),
        currencySymbol: symbol,
      };
    }
  } catch (error) {
    console.error("Error fetching currency from settings:", error);
  }

  // Default fallback
  return { currency: "KES", currencySymbol: "KSh" };
}

