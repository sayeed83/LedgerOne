"use client";

import { Select } from "@ledgerone/ui";
import { useUnits } from "../hooks/use-units";

export interface UnitSelectProps {
  companyUuid: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  optional?: boolean;
}

// Mirrors BaseUnitSelect.tsx's exact pattern, but sources from `useUnits`
// (every Unit, not only base Units) — Ch.34.8's Unit of Measure reference on
// a Product is not restricted to base Units the way Unit's own
// `baseUnitUuid` is (Ch.36.1/36.11).
export function UnitSelect({ companyUuid, value, onChange, label = "Unit of Measure", error, optional = false }: UnitSelectProps) {
  const unitsQuery = useUnits(companyUuid || null);
  const options = (unitsQuery.data ?? []).map((unit) => ({
    value: unit.uuid,
    label: `${unit.name} (${unit.symbol})`,
  }));

  return (
    <Select
      label={label}
      placeholder={
        !companyUuid
          ? "Select a Company first"
          : unitsQuery.isLoading
            ? "Loading units…"
            : optional
              ? "None"
              : "Select a unit"
      }
      options={options}
      value={value}
      error={error}
      disabled={!companyUuid}
      onChange={onChange}
    />
  );
}
