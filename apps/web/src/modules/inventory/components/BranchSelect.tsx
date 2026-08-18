"use client";

import { useQuery } from "@tanstack/react-query";
import type { BranchResponseDto } from "@ledgerone/shared-types";
import { Select } from "@ledgerone/ui";
import * as organizationService from "@/services/organization.service";
import { useCurrentTenant } from "@/hooks/use-current-tenant";

export interface BranchSelectProps {
  companyUuid: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
}

// ARCH-004: Inventory never imports from `modules/organization/*` — this
// reads the Organization module's own `services/organization.service.ts`
// (the sole API chokepoint, not a module-internal file) directly, mirroring
// CompanySelect.tsx's/ProductCategorySelect.tsx's own self-fetching-picker
// pattern (CMP-002 applies only to components/ui|data; a module's own
// components/ may fetch, per 08_FRONTEND_STANDARDS.md Ch.5.3). Branch has
// no CRUD/screens of its own in Inventory — this selector exists only so
// WarehouseForm can assign a Warehouse to an existing Branch (WHS-001:
// every Warehouse belongs to exactly one Branch), reusing the Organization
// module's already-existing `listBranchesByCompany` read endpoint, not a
// new one.
export function BranchSelect({ companyUuid, value, onChange, label = "Branch", error, disabled = false }: BranchSelectProps) {
  const { tenantUuid } = useCurrentTenant();
  const branchesQuery = useQuery<BranchResponseDto[]>({
    queryKey: ["organization", "branches", companyUuid || ""],
    queryFn: () => organizationService.listBranchesByCompany(tenantUuid as string, companyUuid),
    enabled: Boolean(tenantUuid) && Boolean(companyUuid),
  });
  const options = (branchesQuery.data ?? []).map((branch) => ({
    value: branch.uuid,
    label: `${branch.branchCode} — ${branch.branchName}`,
  }));

  return (
    <Select
      label={label}
      placeholder={
        !companyUuid ? "Select a Company first" : branchesQuery.isLoading ? "Loading branches…" : "Select a branch"
      }
      options={options}
      value={value}
      error={error}
      disabled={disabled || !companyUuid}
      onChange={onChange}
    />
  );
}
