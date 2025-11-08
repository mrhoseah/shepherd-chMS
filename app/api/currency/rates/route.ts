import { NextResponse } from "next/server";
import { getExchangeRate } from "@/lib/currency-converter";

/**
 * API endpoint to get exchange rates
 * Used by client components to get current exchange rates
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get("currency") || "KES";

    const rate = await getExchangeRate(currency);

    return NextResponse.json({
      currency: currency.toUpperCase(),
      rate,
      baseCurrency: "USD",
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Error fetching exchange rate:", error);
    return NextResponse.json(
      { error: "Failed to fetch exchange rate" },
      { status: 500 }
    );
  }
}

