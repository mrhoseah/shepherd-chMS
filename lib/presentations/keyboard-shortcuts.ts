"use client";

import { useEffect } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;

        // Skip if target is an input, textarea, or contenteditable
        const target = event.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          // Allow some shortcuts even in inputs (like Ctrl+S)
          if (!shortcut.ctrl && !shortcut.meta) {
            continue;
          }
        }

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

export const PRESENTATION_SHORTCUTS = {
  SAVE: { key: "s", ctrl: true, description: "Save presentation" },
  NEW_SLIDE: { key: "n", ctrl: true, description: "New slide" },
  DELETE: { key: "Delete", description: "Delete selected slide" },
  DUPLICATE: { key: "d", ctrl: true, description: "Duplicate slide" },
  ZOOM_IN: { key: "+", ctrl: true, description: "Zoom in" },
  ZOOM_OUT: { key: "-", ctrl: true, description: "Zoom out" },
  ZOOM_RESET: { key: "0", ctrl: true, description: "Reset zoom" },
  FIT_TO_SCREEN: { key: "f", description: "Fit to screen" },
  FULLSCREEN: { key: "f11", description: "Toggle fullscreen" },
  PREV_SLIDE: { key: "ArrowLeft", description: "Previous slide" },
  NEXT_SLIDE: { key: "ArrowRight", description: "Next slide" },
  UNDO: { key: "z", ctrl: true, description: "Undo" },
  REDO: { key: "y", ctrl: true, description: "Redo" },
  SELECT_ALL: { key: "a", ctrl: true, description: "Select all slides" },
  COPY: { key: "c", ctrl: true, description: "Copy" },
  PASTE: { key: "v", ctrl: true, description: "Paste" },
  CUT: { key: "x", ctrl: true, description: "Cut" },
};

