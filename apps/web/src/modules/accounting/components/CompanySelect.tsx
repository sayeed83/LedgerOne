"use client";

import { Select } from "@ledgerone/ui";
import { useCompaniesForSelect } from "../hooks/use-companies-for-select";

export interface CompanySelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
}

// Module-local, self-fetching picker (CMP-002 applies only to
// components/ui|data; a module's own components/ may fetch, per
// 08_FRONTEND_STANDARDS.md Ch.5.3) — every Accounting entity that's scoped
// by Company reuses this instead of re-wiring the Organization lookup per
// form.
export function CompanySelect({ value, onChange, error, label = "Company" }: CompanySelectProps) {
  const companiesQuery = useCompaniesForSelect();
  const options = (companiesQuery.data ?? []).map((company) => ({
    value: company.uuid,
    label: `${company.companyCode} — ${company.legalName}`,
  }));

  return (
    <Select
      label={label}
      placeholder={companiesQuery.isLoading ? "Loading companies…" : "Select a company"}
      options={options}
      value={value}
      error={error}
      onChange={onChange}
    />
  );
}
