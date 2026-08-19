"use client";

import { Select } from "@ledgerone/ui";
import { useFinancialYearsForSelect } from "../hooks/use-financial-years-for-select";

export interface FinancialYearSelectProps {
  companyUuid: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

// Scopes a report to one Financial Year (00_BUSINESS_RULES.md Ch.81.8) —
// mirrors `BaseUnitSelect.tsx`'s/`AccountGroupSelect.tsx`'s own
// self-fetching-picker pattern. Always optional at the call site: every
// report treats "no Financial Year selected" as "fall back to an explicit
// date/Fiscal Period, or the report's own point-in-time default."
export function FinancialYearSelect({
  companyUuid,
  value,
  onChange,
  label = "Financial Year (optional)",
  error,
}: FinancialYearSelectProps) {
  const financialYearsQuery = useFinancialYearsForSelect(companyUuid || null);
  const options = (financialYearsQuery.data ?? []).map((year) => ({
    value: year.uuid,
    label: `${year.startDate.slice(0, 10)} — ${year.endDate.slice(0, 10)} (${year.status})`,
  }));

  return (
    <Select
      label={label}
      placeholder={
        !companyUuid
          ? "Select a Company first"
          : financialYearsQuery.isLoading
            ? "Loading financial years…"
            : "None"
      }
      options={options}
      value={value}
      error={error}
      disabled={!companyUuid}
      onChange={onChange}
    />
  );
}
