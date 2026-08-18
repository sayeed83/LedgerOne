"use client";

import { Select } from "@ledgerone/ui";
import { useAccountGroups } from "../hooks/use-account-groups";

export interface AccountGroupSelectProps {
  companyUuid: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  excludeUuid?: string;
  optional?: boolean;
}

export function AccountGroupSelect({
  companyUuid,
  value,
  onChange,
  label = "Account Group",
  error,
  excludeUuid,
  optional = false,
}: AccountGroupSelectProps) {
  const accountGroupsQuery = useAccountGroups(companyUuid || null);
  const options = (accountGroupsQuery.data ?? [])
    .filter((group) => group.uuid !== excludeUuid)
    .map((group) => ({ value: group.uuid, label: `${group.name} (${group.accountType})` }));

  return (
    <Select
      label={label}
      placeholder={
        !companyUuid
          ? "Select a Company first"
          : accountGroupsQuery.isLoading
            ? "Loading account groups…"
            : optional
              ? "None"
              : "Select an account group"
      }
      options={options}
      value={value}
      error={error}
      disabled={!companyUuid}
      onChange={onChange}
    />
  );
}
