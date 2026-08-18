"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import type { AccountGroupResponseDto, AccountResponseDto } from "@ledgerone/shared-types";
import { AccountStatus } from "@ledgerone/shared-types";
import { Drawer, LayersIcon, LoadingButton, PlusIcon, Select, Tab, TabList, TabPanel, Tabs } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchBox } from "@/components/ui/SearchBox";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { useCurrentCompany } from "@/hooks/use-current-company";
import { useAccountGroups, useCreateAccountGroup } from "../hooks/use-account-groups";
import { useAccounts, useCreateAccount } from "../hooks/use-accounts";
import { AccountGroupForm } from "../components/AccountGroupForm";
import { AccountForm } from "../components/AccountForm";
import { CompanyContextBar } from "../components/CompanyContextBar";
import { getAccountingErrorMessage } from "../utils/accounting-error-messages";

const PAGE_SIZE = 10;
const groupColumnHelper = createColumnHelper<AccountGroupResponseDto>();
const accountColumnHelper = createColumnHelper<AccountResponseDto>();

export function ChartOfAccountsScreen() {
  const { companyUuid } = useCurrentCompany();
  const [tab, setTab] = useState<"accounts" | "groups">("accounts");

  return (
    <div>
      <PageHeader title="Chart of Accounts" description="Manage Account Groups and the Chart of Accounts." />
      <CompanyContextBar />

      {companyUuid && (
        <Tabs value={tab} onChange={(value) => setTab(value as "accounts" | "groups")}>
          <TabList>
            <Tab value="accounts">Accounts</Tab>
            <Tab value="groups">Account Groups</Tab>
          </TabList>
          <TabPanel value="accounts">
            <AccountsTab companyUuid={companyUuid} />
          </TabPanel>
          <TabPanel value="groups">
            <AccountGroupsTab companyUuid={companyUuid} />
          </TabPanel>
        </Tabs>
      )}
    </div>
  );
}

function AccountsTab({ companyUuid }: { companyUuid: string }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<AccountStatus | undefined>(undefined);
  const accountsQuery = useAccounts({ companyUuid, status: statusFilter });
  const createAccount = useCreateAccount(companyUuid);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const accounts = accountsQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return accounts;
    }
    return accounts.filter(
      (account) => account.code.toLowerCase().includes(term) || account.name.toLowerCase().includes(term),
    );
  }, [accountsQuery.data, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = useMemo(
    () => [
      accountColumnHelper.accessor("code", { header: "Code" }),
      accountColumnHelper.accessor("name", { header: "Name" }),
      accountColumnHelper.accessor("accountType", { header: "Type" }),
      accountColumnHelper.accessor("isPostingAccount", {
        header: "Posting",
        cell: (info) => (info.getValue() ? "Yes" : "No"),
      }),
      accountColumnHelper.accessor("status", { header: "Status", cell: (info) => <StatusBadge status={info.getValue()} /> }),
    ],
    [],
  );

  return (
    <div>
      <Toolbar
        filters={
          <Select
            label="Status"
            compact
            value={statusFilter ?? ""}
            options={[
              { value: "", label: "All statuses" },
              { value: AccountStatus.Draft, label: "Draft" },
              { value: AccountStatus.Active, label: "Active" },
              { value: AccountStatus.Inactive, label: "Inactive" },
            ]}
            onChange={(next) => setStatusFilter((next || undefined) as AccountStatus | undefined)}
          />
        }
        actions={
          <LoadingButton isLoading={false} leadingIcon={<PlusIcon className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
            New Account
          </LoadingButton>
        }
      >
        <SearchBox
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by code or name…"
        />
      </Toolbar>

      <DataTable
        columns={columns}
        data={paged}
        isLoading={accountsQuery.isLoading}
        isError={accountsQuery.isError}
        errorMessage={getAccountingErrorMessage(accountsQuery.error)}
        emptyIcon={<LayersIcon className="h-6 w-6" />}
        emptyTitle={search ? "No Accounts match your search" : "No Accounts yet"}
        emptyDescription={search ? "Try a different search term." : "Create your first Account to get started."}
        emptyAction={
          !search && (
            <LoadingButton isLoading={false} onClick={() => setIsCreateOpen(true)}>
              New Account
            </LoadingButton>
          )
        }
        onRowClick={(account) => router.push(`/accounting/chart-of-accounts/${account.uuid}`)}
        getRowKey={(account) => account.uuid}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />

      <Drawer isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Account" description="Add an Account to the Chart of Accounts.">
        <AccountForm
          companyUuid={companyUuid}
          submitLabel="Create Account"
          isSubmitting={createAccount.isPending}
          serverError={getAccountingErrorMessage(createAccount.error)}
          fieldErrors={createAccount.error?.details}
          onSubmit={(values) => createAccount.mutate(values, { onSuccess: () => setIsCreateOpen(false) })}
        />
      </Drawer>
    </div>
  );
}

function AccountGroupsTab({ companyUuid }: { companyUuid: string }) {
  const router = useRouter();
  const accountGroupsQuery = useAccountGroups(companyUuid);
  const createAccountGroup = useCreateAccountGroup(companyUuid);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const groups = accountGroupsQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return groups;
    }
    return groups.filter((group) => group.name.toLowerCase().includes(term));
  }, [accountGroupsQuery.data, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = useMemo(
    () => [
      groupColumnHelper.accessor("name", { header: "Name" }),
      groupColumnHelper.accessor("accountType", { header: "Type" }),
    ],
    [],
  );

  return (
    <div>
      <Toolbar
        actions={
          <LoadingButton isLoading={false} leadingIcon={<PlusIcon className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
            New Account Group
          </LoadingButton>
        }
      >
        <SearchBox
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by name…"
        />
      </Toolbar>

      <DataTable
        columns={columns}
        data={paged}
        isLoading={accountGroupsQuery.isLoading}
        isError={accountGroupsQuery.isError}
        errorMessage={getAccountingErrorMessage(accountGroupsQuery.error)}
        emptyIcon={<LayersIcon className="h-6 w-6" />}
        emptyTitle={search ? "No Account Groups match your search" : "No Account Groups yet"}
        emptyDescription={search ? "Try a different search term." : "Create your first Account Group to get started."}
        emptyAction={
          !search && (
            <LoadingButton isLoading={false} onClick={() => setIsCreateOpen(true)}>
              New Account Group
            </LoadingButton>
          )
        }
        onRowClick={(group) => router.push(`/accounting/chart-of-accounts/groups/${group.uuid}`)}
        getRowKey={(group) => group.uuid}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />

      <Drawer isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Account Group" description="Create an Account Group for this Company.">
        <AccountGroupForm
          companyUuid={companyUuid}
          submitLabel="Create Account Group"
          isSubmitting={createAccountGroup.isPending}
          serverError={getAccountingErrorMessage(createAccountGroup.error)}
          fieldErrors={createAccountGroup.error?.details}
          onSubmit={(values) => createAccountGroup.mutate(values, { onSuccess: () => setIsCreateOpen(false) })}
        />
      </Drawer>
    </div>
  );
}
