import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CurrencyState {
  currency: string;
  currencySymbol: string;
  exchangeRate: number; // Rate from USD to display currency
  initialized: boolean;
}

const initialState: CurrencyState = {
  currency: "KES",
  currencySymbol: "KSh",
  exchangeRate: 130, // Default KES rate
  initialized: false,
};

const currencySlice = createSlice({
  name: "currency",
  initialState,
  reducers: {
    setCurrency: (
      state,
      action: PayloadAction<{
        currency: string;
        currencySymbol: string;
        exchangeRate?: number;
      }>
    ) => {
      state.currency = action.payload.currency;
      state.currencySymbol = action.payload.currencySymbol;
      if (action.payload.exchangeRate) {
        state.exchangeRate = action.payload.exchangeRate;
      }
      state.initialized = true;
    },
    setExchangeRate: (state, action: PayloadAction<number>) => {
      state.exchangeRate = action.payload;
    },
    initializeCurrency: (
      state,
      action: PayloadAction<{
        currency: string;
        currencySymbol: string;
        exchangeRate?: number;
      }>
    ) => {
      state.currency = action.payload.currency;
      state.currencySymbol = action.payload.currencySymbol;
      if (action.payload.exchangeRate) {
        state.exchangeRate = action.payload.exchangeRate;
      }
      state.initialized = true;
    },
  },
});

export const { setCurrency, setExchangeRate, initializeCurrency } =
  currencySlice.actions;

export default currencySlice.reducer;
