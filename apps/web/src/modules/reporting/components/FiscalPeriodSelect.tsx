"use client";

import { Select } from "@ledgerone/ui";
import { useFiscalPeriodsForSelect } from "../hooks/use-fiscal-periods-for-select";

export interface FiscalPeriodSelectProps {
  financialYearUuid: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

// Scopes a report to one Fiscal Period, narrower than a whole Financial
// Year (00_BUSINESS_RULES.md Ch.81.8) — mirrors `FinancialYearSelect.tsx`'s
// own pattern. Requires a Financial Year to already be selected (Fiscal
// Period has no Company-wide list, only a per-Financial-Year one).
export function FiscalPeriodSelect({
  financialYearUuid,
  value,
  onChange,
  label = "Fiscal Period (optional)",
  error,
}: FiscalPeriodSelectProps) {
  const fiscalPeriodsQuery = useFiscalPeriodsForSelect(financialYearUuid || null);
  const options = (fiscalPeriodsQuery.data ?? []).map((period) => ({
    value: period.uuid,
    label: `${period.startDate.slice(0, 10)} — ${period.endDate.slice(0, 10)} (${period.status})`,
  }));

  return (
    <Select
      label={label}
      placeholder={
        !financialYearUuid
          ? "Select a Financial Year first"
          : fiscalPeriodsQuery.isLoading
            ? "Loading fiscal periods…"
            : "None"
      }
      options={options}
      value={value}
      error={error}
      disabled={!financialYearUuid}
      onChange={onChange}
    />
  );
}
