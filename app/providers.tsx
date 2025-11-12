"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Provider } from "react-redux";
import { store } from "@/lib/store/store";
import { useEffect } from "react";
import { loadState } from "@/lib/store/persist";
import { initializeSettings } from "@/lib/store/slices/settingsSlice";
import { initializeCurrency } from "@/lib/store/slices/currencySlice";
import { ToastProvider } from "@/components/ui/toast";

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
      <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </SessionProvider>
    </Provider>
  );
}
