"use client";

import { useQuery } from "@tanstack/react-query";
import type { TaxGroupResponseDto } from "@ledgerone/shared-types";
import { Select } from "@ledgerone/ui";
import * as accountingService from "@/services/accounting.service";

export interface TaxGroupSelectProps {
  companyUuid: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

// ARCH-004: Inventory never imports from `modules/accounting/*` — this reads
// the Accounting module's own `services/accounting.service.ts` (the sole API
// chokepoint, not a module-internal file) directly, mirroring
// BranchSelect.tsx's own cross-module self-fetching-picker pattern. Tax
// Group has no CRUD/screens of its own in Inventory — this selector exists
// only so ProductCategoryForm can assign a Category's default Tax Group
// (00_BUSINESS_RULES.md Ch.35.3/PCT-002), reusing Accounting's
// already-existing `listTaxGroups` read endpoint, not a new one.
export function TaxGroupSelect({
  companyUuid,
  value,
  onChange,
  label = "Default Tax Group (optional)",
  error,
}: TaxGroupSelectProps) {
  const taxGroupsQuery = useQuery<TaxGroupResponseDto[]>({
    queryKey: ["accounting", "tax-groups", companyUuid || ""],
    queryFn: () => accountingService.listTaxGroups(companyUuid),
    enabled: Boolean(companyUuid),
  });
  const options = (taxGroupsQuery.data ?? []).map((taxGroup) => ({ value: taxGroup.uuid, label: taxGroup.name }));

  return (
    <Select
      label={label}
      placeholder={
        !companyUuid ? "Select a Company first" : taxGroupsQuery.isLoading ? "Loading tax groups…" : "None"
      }
      options={options}
      value={value}
      error={error}
      disabled={!companyUuid}
      onChange={onChange}
    />
  );
}
