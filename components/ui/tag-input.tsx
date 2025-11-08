"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxTags?: number;
  suggestions?: string[];
  onAddTag?: (tag: string) => void;
  onRemoveTag?: (tag: string) => void;
}

const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>(
  (
    {
      value = [],
      onChange,
      placeholder = "Add tags...",
      className,
      disabled = false,
      maxTags,
      suggestions = [],
      onAddTag,
      onRemoveTag,
      ...props
    },
    ref
  ) => {
    const [inputValue, setInputValue] = React.useState("");
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const filteredSuggestions = React.useMemo(() => {
      if (!inputValue.trim()) return suggestions;
      return suggestions.filter(
        (suggestion) =>
          suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
          !value.includes(suggestion)
      );
    }, [inputValue, suggestions, value]);

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag(inputValue.trim());
      } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
        removeTag(value[value.length - 1]);
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
        inputRef.current?.blur();
      } else if (e.key === "ArrowDown" && filteredSuggestions.length > 0) {
        e.preventDefault();
        setShowSuggestions(true);
      }
    };

    const addTag = (tag: string) => {
      if (!tag || value.includes(tag)) {
        setInputValue("");
        return;
      }

      if (maxTags && value.length >= maxTags) {
        return;
      }

      const newTags = [...value, tag];
      onChange(newTags);
      onAddTag?.(tag);
      setInputValue("");
      setShowSuggestions(false);
    };

    const removeTag = (tag: string) => {
      const newTags = value.filter((t) => t !== tag);
      onChange(newTags);
      onRemoveTag?.(tag);
    };

    const handleSuggestionClick = (suggestion: string) => {
      addTag(suggestion);
    };

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setShowSuggestions(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    return (
      <div ref={containerRef} className={cn("relative w-full", className)}>
        <div
          className={cn(
            "flex flex-wrap gap-2 min-h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors",
            "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
          onClick={() => inputRef.current?.focus()}
        >
          {value.map((tag, index) => (
            <Badge
              key={`${tag}-${index}`}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span>{tag}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag);
                  }}
                  className="ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
          <Input
            ref={ref || inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleInputKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={value.length === 0 ? placeholder : ""}
            disabled={disabled || (maxTags ? value.length >= maxTags : false)}
            className="flex-1 border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-w-[120px]"
            {...props}
          />
        </div>
        {showSuggestions && filteredSuggestions.length > 0 && inputValue && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
            <div className="max-h-60 overflow-auto p-1">
              {filteredSuggestions.map((suggestion) => (
                <div
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  {suggestion}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

TagInput.displayName = "TagInput";

export { TagInput };

