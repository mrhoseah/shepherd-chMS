import { NextResponse } from "next/server";
import { getCurrencyFromSettings } from "@/lib/currency-server";
import { getExchangeRate } from "@/lib/currency-converter";

/**
 * API endpoint to get currency settings with exchange rate
 * Used by client components to fetch currency from database
 */
export async function GET() {
  try {
    const currency = await getCurrencyFromSettings();
    
    // Get exchange rate for the currency
    const exchangeRate = await getExchangeRate(currency.currency);
    
    return NextResponse.json({
      ...currency,
      exchangeRate,
    });
  } catch (error: any) {
    console.error("Error fetching currency:", error);
    return NextResponse.json(
      { currency: "KES", currencySymbol: "KSh", exchangeRate: 130 },
      { status: 200 }
    );
  }
}

