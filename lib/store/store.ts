import { configureStore } from "@reduxjs/toolkit";
import settingsReducer from "./slices/settingsSlice";
import currencyReducer from "./slices/currencySlice";
import { loadState, saveState } from "./persist";

// Load initial state from localStorage
const preloadedState = typeof window !== "undefined" ? loadState() : undefined;

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    currency: currencyReducer,
  },
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

// Subscribe to store changes and save to localStorage
if (typeof window !== "undefined") {
  store.subscribe(() => {
    saveState({
      settings: store.getState().settings,
      currency: store.getState().currency,
    });
  });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

