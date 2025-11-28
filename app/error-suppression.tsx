"use client";

import { useEffect } from "react";

/**
 * Suppresses known harmless errors in development
 * - Performance.measure errors from Next.js 16.0.1 Turbopack
 */
export function ErrorSuppression() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const originalError = console.error;
      console.error = (...args: any[]) => {
        const message = args[0]?.toString() || "";
        
        // Suppress Performance.measure errors from Turbopack
        if (
          message.includes("Performance.measure") ||
          message.includes("Given attribute end cannot be negative")
        ) {
          return;
        }
        
        originalError.apply(console, args);
      };

      // Also suppress in global error handler
      const originalOnError = window.onerror;
      window.onerror = (message, source, lineno, colno, error) => {
        const msg = message?.toString() || "";
        
        if (
          msg.includes("Performance.measure") ||
          msg.includes("Given attribute end cannot be negative")
        ) {
          return true; // Prevent default error handling
        }
        
        if (originalOnError) {
          return originalOnError(message, source, lineno, colno, error);
        }
        return false;
      };
    }
  }, []);

  return null;
}
