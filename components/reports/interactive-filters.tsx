"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface FilterState {
  dateRange?: { from: Date; to: Date };
  categories?: string[];
  status?: string;
  search?: string;
  [key: string]: any;
}

interface InteractiveFiltersProps {
  filters: FilterConfig[];
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: "date-range" | "select" | "multi-select" | "search" | "number-range";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export function InteractiveFilters({
  filters,
  onFilterChange,
  initialFilters = {},
}: InteractiveFiltersProps) {
  const [filterState, setFilterState] = useState<FilterState>(initialFilters);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    onFilterChange(filterState);
  }, [filterState]);

  const updateFilter = (key: string, value: any) => {
    setFilterState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilter = (key: string) => {
    setFilterState((prev) => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  };

  const clearAllFilters = () => {
    setFilterState({});
  };

  const activeFiltersCount = Object.keys(filterState).filter(
    (key) => filterState[key] !== undefined && filterState[key] !== null && filterState[key] !== ""
  ).length;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs h-7"
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filters.map((filter) => {
            const value = filterState[filter.key];

            switch (filter.type) {
              case "date-range":
                return (
                  <div key={filter.key} className="space-y-2">
                    <Label className="text-xs">{filter.label}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {value?.from ? (
                            value.to ? (
                              <>
                                {format(value.from, "LLL dd, y")} -{" "}
                                {format(value.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(value.from, "LLL dd, y")
                            )
                          ) : (
                            <span>{filter.placeholder || "Pick a date range"}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          defaultMonth={value?.from}
                          selected={value}
                          onSelect={(range: any) => updateFilter(filter.key, range)}
                          numberOfMonths={2}
                          className="rounded-md border"
                        />
                      </PopoverContent>
                    </Popover>
                    {value && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearFilter(filter.key)}
                        className="h-6 text-xs"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                );

              case "select":
                return (
                  <div key={filter.key} className="space-y-2">
                    <Label className="text-xs">{filter.label}</Label>
                    <Select
                      value={value || ""}
                      onValueChange={(val) => updateFilter(filter.key, val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={filter.placeholder || "Select..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {filter.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {value && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearFilter(filter.key)}
                        className="h-6 text-xs"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                );

              case "search":
                return (
                  <div key={filter.key} className="space-y-2">
                    <Label className="text-xs">{filter.label}</Label>
                    <Input
                      placeholder={filter.placeholder || "Search..."}
                      value={value || ""}
                      onChange={(e) => updateFilter(filter.key, e.target.value)}
                    />
                    {value && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearFilter(filter.key)}
                        className="h-6 text-xs"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                );

              default:
                return null;
            }
          })}
        </div>
      </CardContent>
    </Card>
  );
}

