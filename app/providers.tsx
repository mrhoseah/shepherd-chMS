"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Provider } from "react-redux";
import { store } from "@/lib/store/store";
import { useEffect } from "react";
import { loadState } from "@/lib/store/persist";
import { initializeSettings } from "@/lib/store/slices/settingsSlice";
import { initializeCurrency } from "@/lib/store/slices/currencySlice";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load persisted state from localStorage on mount
    if (typeof window !== "undefined") {
      const persistedState = loadState();
      if (persistedState) {
        // Initialize Redux state from localStorage
        if (persistedState.settings) {
          store.dispatch(initializeSettings(persistedState.settings));
        }
        if (persistedState.currency) {
          store.dispatch(initializeCurrency(persistedState.currency));
        }
      }
    }
  }, []);

  return (
    <Provider store={store}>
      <SessionProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </SessionProvider>
    </Provider>
  );
}
