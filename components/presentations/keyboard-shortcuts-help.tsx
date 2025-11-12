"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PRESENTATION_SHORTCUTS } from "@/lib/presentations/keyboard-shortcuts";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  const shortcuts = [
    PRESENTATION_SHORTCUTS.SAVE,
    PRESENTATION_SHORTCUTS.NEW_SLIDE,
    PRESENTATION_SHORTCUTS.DELETE,
    PRESENTATION_SHORTCUTS.DUPLICATE,
    PRESENTATION_SHORTCUTS.COPY,
    PRESENTATION_SHORTCUTS.PASTE,
    PRESENTATION_SHORTCUTS.CUT,
    PRESENTATION_SHORTCUTS.UNDO,
    PRESENTATION_SHORTCUTS.REDO,
    PRESENTATION_SHORTCUTS.ZOOM_IN,
    PRESENTATION_SHORTCUTS.ZOOM_OUT,
    PRESENTATION_SHORTCUTS.ZOOM_RESET,
    PRESENTATION_SHORTCUTS.FIT_TO_SCREEN,
    PRESENTATION_SHORTCUTS.PREV_SLIDE,
    PRESENTATION_SHORTCUTS.NEXT_SLIDE,
    PRESENTATION_SHORTCUTS.SELECT_ALL,
  ];

  const formatKey = (shortcut: typeof PRESENTATION_SHORTCUTS.SAVE) => {
    const parts = [];
    if (shortcut.ctrl) parts.push("Ctrl");
    if (shortcut.meta) parts.push("Cmd");
    if (shortcut.shift) parts.push("Shift");
    if (shortcut.alt) parts.push("Alt");
    parts.push(shortcut.key === " " ? "Space" : shortcut.key);
    return parts.join(" + ");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {shortcut.description}
                </span>
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                  {formatKey(shortcut)}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

