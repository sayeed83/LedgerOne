"use client";

import { Select } from "@ledgerone/ui";
import { useBaseUnits } from "../hooks/use-base-units";

export interface BaseUnitSelectProps {
  companyUuid: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  excludeUuid?: string;
  optional?: boolean;
}

// Mirrors Account Group's own AccountGroupSelect.tsx pattern exactly.
// Sources options from `useBaseUnits` (not the plain `useUnits` list) —
// Ch.36.1/36.11: an alternate Unit's base Unit is itself always a base
// Unit (no chapter describes chaining an alternate Unit off another
// alternate Unit), so only rows with no `baseUnitId` of their own are
// valid choices here.
export function BaseUnitSelect({
  companyUuid,
  value,
  onChange,
  label = "Base Unit",
  error,
  excludeUuid,
  optional = false,
}: BaseUnitSelectProps) {
  const baseUnitsQuery = useBaseUnits(companyUuid || null);
  const options = (baseUnitsQuery.data ?? [])
    .filter((unit) => unit.uuid !== excludeUuid)
    .map((unit) => ({ value: unit.uuid, label: `${unit.name} (${unit.symbol})` }));

  return (
    <Select
      label={label}
      placeholder={
        !companyUuid
          ? "Select a Company first"
          : baseUnitsQuery.isLoading
            ? "Loading base Units…"
            : optional
              ? "None"
              : "Select a base Unit"
      }
      options={options}
      value={value}
      error={error}
      disabled={!companyUuid}
      onChange={onChange}
    />
  );
}
