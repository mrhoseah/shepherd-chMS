"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countries } from "@/lib/countries";

interface MemberLocationFieldsProps {
  country: string;
  state: string;
  county: string;
  zipCode: string;
  onCountryChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onCountyChange: (value: string) => void;
  onZipCodeChange: (value: string) => void;
}

export function MemberLocationFields({
  country,
  state,
  county,
  zipCode,
  onCountryChange,
  onStateChange,
  onCountyChange,
  onZipCodeChange,
}: MemberLocationFieldsProps) {
  const [states, setStates] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);

  useEffect(() => {
    const fetchStates = async () => {
      if (!country) {
        setStates([]);
        return;
      }

      setLoadingStates(true);
      try {
        const res = await fetch(`/api/locations/states?country=${country}`);
        const data = await res.json();
        setStates(data.states || []);
      } catch (error) {
        console.error("Error fetching states:", error);
        setStates([]);
      } finally {
        setLoadingStates(false);
      }
    };

    fetchStates();
  }, [country]);

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="country">Country</Label>
          <Select value={country} onValueChange={onCountryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="zipCode">Zip/Postal Code</Label>
          <Input
            id="zipCode"
            value={zipCode}
            onChange={(e) => onZipCodeChange(e.target.value)}
          />
        </div>
      </div>

      {states.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="state">
              {country === "KE" ? "County" : country === "US" ? "State" : "State/Province"}
            </Label>
            <Select
              value={state}
              onValueChange={onStateChange}
              disabled={loadingStates}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${country === "KE" ? "county" : "state"}`} />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {country === "US" && (
            <div>
              <Label htmlFor="county">County</Label>
              <Input
                id="county"
                value={county}
                onChange={(e) => onCountyChange(e.target.value)}
                placeholder="Enter county"
              />
            </div>
          )}
        </div>
      )}

      {country === "KE" && state && (
        <div>
          <Label htmlFor="county">Sub-County (Optional)</Label>
          <Input
            id="county"
            value={county}
            onChange={(e) => onCountyChange(e.target.value)}
            placeholder="Enter sub-county"
          />
        </div>
      )}
    </>
  );
}

