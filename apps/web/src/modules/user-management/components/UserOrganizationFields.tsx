"use client";

import { Select } from "@ledgerone/ui";
import { useCurrentTenant } from "@/hooks/use-current-tenant";
import { useBranchOptions, useCompanyOptions, useDepartmentOptions } from "../hooks/use-organization-options";

export interface UserOrganizationFieldsProps {
  companyUuid: string;
  branchUuid: string;
  departmentUuid: string;
  companyError?: string;
  onCompanyChange: (companyUuid: string) => void;
  onBranchChange: (branchUuid: string) => void;
  onDepartmentChange: (departmentUuid: string) => void;
}

// Assign Company/Branch/Department: a User's Company/Branch/Department are
// cross-module references into Organization (FK-002); there is no separate
// "assign" endpoint — they're set via the same `PUT /users/:userUuid` body
// as every other field. Reads the current Tenant from the shared
// `CurrentTenantProvider` (STATE-003) purely to populate these pickers'
// options; if no Tenant has been loaded yet in Organization, the pickers
// are disabled with a hint rather than blocking this form entirely (FP4 —
// convenience, not enforcement).
export function UserOrganizationFields({
  companyUuid,
  branchUuid,
  departmentUuid,
  companyError,
  onCompanyChange,
  onBranchChange,
  onDepartmentChange,
}: UserOrganizationFieldsProps) {
  const { tenantUuid } = useCurrentTenant();
  const companiesQuery = useCompanyOptions(tenantUuid);
  const branchesQuery = useBranchOptions(tenantUuid, companyUuid || null);
  const departmentsQuery = useDepartmentOptions(tenantUuid, companyUuid || null);

  const noTenantHint = tenantUuid
    ? undefined
    : "Load a Tenant in Organization to populate this list.";

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      <Select
        label="Company"
        placeholder="Select a Company…"
        options={(companiesQuery.data ?? []).map((company) => ({
          value: company.uuid,
          label: `${company.companyCode} — ${company.legalName}`,
        }))}
        value={companyUuid}
        onChange={onCompanyChange}
        disabled={!tenantUuid || companiesQuery.isLoading}
        error={companyError}
        hint={noTenantHint}
      />
      <Select
        label="Branch"
        placeholder="No Branch"
        options={(branchesQuery.data ?? []).map((branch) => ({
          value: branch.uuid,
          label: `${branch.branchCode} — ${branch.branchName}`,
        }))}
        value={branchUuid}
        onChange={onBranchChange}
        disabled={!tenantUuid || !companyUuid || branchesQuery.isLoading}
        hint={companyUuid ? undefined : "Select a Company first."}
      />
      <Select
        label="Department"
        placeholder="No Department"
        options={(departmentsQuery.data ?? []).map((department) => ({
          value: department.uuid,
          label: `${department.departmentCode} — ${department.departmentName}`,
        }))}
        value={departmentUuid}
        onChange={onDepartmentChange}
        disabled={!tenantUuid || !companyUuid || departmentsQuery.isLoading}
        hint={companyUuid ? undefined : "Select a Company first."}
      />
    </div>
  );
}
