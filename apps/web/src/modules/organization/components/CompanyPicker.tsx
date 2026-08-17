"use client";

import { Select } from "@ledgerone/ui";
import { useCompanies } from "../hooks/use-companies";

export interface CompanyPickerProps {
  tenantUuid: string | null;
  value: string;
  onChange: (companyUuid: string) => void;
}

// Smart, module-local component (fetches Companies) — the "which Company
// am I browsing?" filter that Branch/Department screens need, since the
// backend only lists Branches/Departments scoped to one Company at a time
// (no "list all Branches for a Tenant" endpoint exists).
export function CompanyPicker({ tenantUuid, value, onChange }: CompanyPickerProps) {
  const companiesQuery = useCompanies(tenantUuid);
  const options = (companiesQuery.data ?? []).map((company) => ({
    value: company.uuid,
    label: `${company.companyCode} — ${company.legalName}`,
  }));

  return (
    <Select
      label="Company"
      placeholder="Select a Company…"
      options={options}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={companiesQuery.isLoading || options.length === 0}
    />
  );
}
