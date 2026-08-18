"use client";

import { Select } from "@ledgerone/ui";
import { AccountStatus } from "@ledgerone/shared-types";
import { useAccounts } from "../hooks/use-accounts";

export interface AccountPickerProps {
  companyUuid: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  excludeUuid?: string;
  postingOnly?: boolean;
}

// Reused both as the Chart of Accounts form's parent-Account field and as
// each Journal Entry line's Account field (the module's dedicated
// "AccountPicker" called for by this milestone's brief).
export function AccountPicker({
  companyUuid,
  value,
  onChange,
  label = "Account",
  error,
  excludeUuid,
  postingOnly = false,
}: AccountPickerProps) {
  const accountsQuery = useAccounts(
    companyUuid ? { companyUuid, status: AccountStatus.Active } : undefined,
  );
  const options = (accountsQuery.data ?? [])
    .filter((account) => account.uuid !== excludeUuid)
    .filter((account) => !postingOnly || account.isPostingAccount)
    .map((account) => ({ value: account.uuid, label: `${account.code} — ${account.name}` }));

  return (
    <Select
      label={label}
      placeholder={
        !companyUuid
          ? "Select a Company first"
          : accountsQuery.isLoading
            ? "Loading accounts…"
            : "Select an account"
      }
      options={options}
      value={value}
      error={error}
      disabled={!companyUuid}
      onChange={onChange}
    />
  );
}
