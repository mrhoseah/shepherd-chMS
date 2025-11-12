"use client";

import { useState, useEffect, useCallback } from "react";

interface UseMultiSelectOptions {
  items: string[];
  onSelectionChange?: (selected: string[]) => void;
}

export function useMultiSelect({ items, onSelectionChange }: UseMultiSelectOptions) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const select = useCallback((id: string) => {
    setSelected((prev) => new Set([id]));
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(items));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelected(new Set());
  }, []);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  useEffect(() => {
    onSelectionChange?.(Array.from(selected));
  }, [selected, onSelectionChange]);

  return {
    selected: Array.from(selected),
    selectedSet: selected,
    toggle,
    select,
    selectAll,
    clearSelection,
    isSelected,
    count: selected.size,
  };
}

