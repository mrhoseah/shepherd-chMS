# Currency Conversion System

## Overview

The application stores all monetary amounts **internally in USD** (dollars) in the database, but displays them to users in their configured currency with real-time conversion.

## Architecture

### Internal Storage
- All amounts in database are stored in **USD**
- This ensures consistency and makes financial reporting easier
- No need to track which currency each transaction was in

### Display Layer
- Users see amounts converted to their configured currency
- Conversion happens in real-time using exchange rates
- Exchange rates are cached for 1 hour to reduce API calls

## Free Currency API

We use **ExchangeRate-API** (exchangerate-api.com):
- **Free Tier**: 1,500 requests/month
- **No API Key Required**: Works without authentication
- **Real-time Rates**: Updated daily
- **160+ Currencies**: Supports all major currencies

### Alternative Free APIs
If you need more requests or different features:
1. **Fixer.io** - Free tier: 100 requests/month (requires API key)
2. **CurrencyAPI.net** - Free tier: 300 requests/month
3. **OpenExchangeRates** - Free tier: 1,000 requests/month (requires API key)

## Implementation

### Files

1. **`lib/currency-converter.ts`**
   - Fetches exchange rates from API
   - Caches rates for 1 hour
   - Provides conversion functions

2. **`app/api/currency/rates/route.ts`**
   - API endpoint to get exchange rates
   - Used by client components

3. **`lib/store/slices/currencySlice.ts`**
   - Redux slice for currency state
   - Stores currency, symbol, and exchange rate

### Usage

```typescript
import { formatCurrencyWithConversionSync } from "@/lib/currency-converter";
import { useAppSelector } from "@/lib/store/hooks";

// In component
const currency = useAppSelector((state) => state.currency);

// Display amount (stored in USD, displayed in user's currency)
formatCurrencyWithConversionSync(
  usdAmount,           // Amount in USD from database
  currency.currency,    // User's display currency
  currency.currencySymbol,
  currency.exchangeRate // Exchange rate from USD to display currency
);
```

## Database Schema

**Important**: All `amount`, `price`, `balance` fields in the database should store values in **USD**.

Example:
- User donates 1,000 KES
- Convert to USD: 1,000 / 130 = ~7.69 USD
- Store `7.69` in database
- Display: Convert back to KES when showing to user

## Converting User Input

When a user enters an amount in their local currency:

```typescript
import { convertToUSD } from "@/lib/currency-converter";

// User enters 1,000 KES
const localAmount = 1000;
const localCurrency = "KES";

// Convert to USD for storage
const usdAmount = await convertToUSD(localAmount, localCurrency);
// Store usdAmount in database
```

## Benefits

1. **Consistency**: All financial data in one currency
2. **Accuracy**: Real-time exchange rates
3. **Flexibility**: Users see amounts in their preferred currency
4. **Reporting**: Easier to generate financial reports in USD
5. **Free**: Uses free API tier (1,500 requests/month)

## Rate Limiting

- Exchange rates are cached for 1 hour
- Reduces API calls significantly
- If you exceed 1,500 requests/month, consider:
  - Increasing cache duration
  - Using a different API
  - Implementing a paid tier

## Future Enhancements

- Historical exchange rates for past transactions
- Multi-currency support (store original currency + USD)
- Automatic rate refresh on currency change
- Rate alerts for significant changes

