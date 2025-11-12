"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface CrossFilterContextType {
  filters: Record<string, any>;
  setFilter: (key: string, value: any) => void;
  clearFilter: (key: string) => void;
  clearAll: () => void;
}

const CrossFilterContext = createContext<CrossFilterContextType | undefined>(undefined);

export function CrossFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Record<string, any>>({});

  const setFilter = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilter = (key: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const clearAll = () => {
    setFilters({});
  };

  return (
    <CrossFilterContext.Provider value={{ filters, setFilter, clearFilter, clearAll }}>
      {children}
    </CrossFilterContext.Provider>
  );
}

export function useCrossFilter() {
  const context = useContext(CrossFilterContext);
  if (!context) {
    throw new Error("useCrossFilter must be used within CrossFilterProvider");
  }
  return context;
}

interface CrossFilterableChartProps {
  filterKey: string;
  children: ReactNode;
  onFilterChange?: (value: any) => void;
}

export function CrossFilterableChart({
  filterKey,
  children,
  onFilterChange,
}: CrossFilterableChartProps) {
  const { setFilter } = useCrossFilter();

  const handleClick = (data: any) => {
    setFilter(filterKey, data);
    onFilterChange?.(data);
  };

  return <div onClick={() => handleClick(null)}>{children}</div>;
}

