"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

interface LeaderComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  availableLeaders: User[];
  excludeUserIds?: string[];
  placeholder?: string;
  disabled?: boolean;
}

export function LeaderCombobox({
  value,
  onValueChange,
  availableLeaders,
  excludeUserIds = [],
  placeholder = "Select a leader...",
  disabled = false,
}: LeaderComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedLeader = availableLeaders.find((leader) => leader.id === value);

  // Filter out excluded leaders
  const filteredLeaders = availableLeaders.filter(
    (leader) => !excludeUserIds.includes(leader.id)
  );

  // Create searchable value for each leader (name + email)
  const getLeaderValue = (leader: User) => {
    const name = `${leader.firstName} ${leader.lastName}`.toLowerCase();
    const email = (leader.email || "").toLowerCase();
    return `${name} ${email}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedLeader
            ? `${selectedLeader.firstName} ${selectedLeader.lastName}${
                selectedLeader.email ? ` (${selectedLeader.email})` : ""
              }`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by name or email..." className="h-9" />
          <CommandList>
            <CommandEmpty>No leaders found.</CommandEmpty>
            <CommandGroup>
              {filteredLeaders.map((leader) => (
                <CommandItem
                  key={leader.id}
                  value={getLeaderValue(leader)}
                  onSelect={() => {
                    onValueChange(leader.id === value ? "" : leader.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {leader.firstName} {leader.lastName}
                    </div>
                    {leader.email && (
                      <div className="text-xs text-gray-500">{leader.email}</div>
                    )}
                  </div>
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4",
                      value === leader.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

