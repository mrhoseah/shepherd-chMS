"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Users, DollarSign, Calendar, UsersRound, Building2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  url: string;
  [key: string]: any;
}

interface SearchResults {
  users: SearchResult[];
  donations: SearchResult[];
  events: SearchResult[];
  groups: SearchResult[];
  departments: SearchResult[];
}

const typeIcons: Record<string, any> = {
  user: Users,
  donation: DollarSign,
  event: Calendar,
  group: UsersRound,
  department: Building2,
};

const typeColors: Record<string, string> = {
  user: "bg-blue-100 text-blue-700",
  donation: "bg-green-100 text-green-700",
  event: "bg-purple-100 text-purple-700",
  group: "bg-orange-100 text-orange-700",
  department: "bg-indigo-100 text-indigo-700",
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setResults(null);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      } else if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const performSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
        setOpen(true);
      } else {
        setResults(null);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (url: string) => {
    router.push(url);
    setOpen(false);
    setQuery("");
  };

  const allResults: SearchResult[] = results
    ? [
        ...results.users,
        ...results.donations,
        ...results.events,
        ...results.groups,
        ...results.departments,
      ]
    : [];

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search members, donations, events... (⌘K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length >= 2) {
              setOpen(true);
            }
          }}
          onFocus={() => {
            if (query.length >= 2 && results) {
              setOpen(true);
            }
          }}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults(null);
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
        )}
      </div>

      {open && allResults.length > 0 && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-lg max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {allResults.map((result, index) => {
              const Icon = typeIcons[result.type] || Search;
              return (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result.url)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b last:border-b-0 ${
                    selectedIndex === index ? "bg-gray-50 dark:bg-gray-800" : ""
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${typeColors[result.type] || "bg-gray-100"}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{result.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {result.type}
                        </Badge>
                      </div>
                      {result.subtitle && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {open && query.length >= 2 && !loading && allResults.length === 0 && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-lg">
          <CardContent className="p-4 text-center text-sm text-gray-500">
            No results found for "{query}"
          </CardContent>
        </Card>
      )}
    </div>
  );
}

