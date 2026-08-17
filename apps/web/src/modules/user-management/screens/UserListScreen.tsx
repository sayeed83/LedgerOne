"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import type { UserResponseDto } from "@ledgerone/shared-types";
import { Drawer, LoadingButton, PlusIcon, UsersIcon } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchBox } from "@/components/ui/SearchBox";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { useCurrentTenant } from "@/hooks/use-current-tenant";
import { useUsers } from "../hooks/use-users";
import { useUserSearch } from "../hooks/use-user-search";
import { useInviteUser } from "../hooks/use-invite-user";
import { useCompanyOptions } from "../hooks/use-organization-options";
import { UserForm } from "../components/UserForm";
import { getUserManagementErrorMessage } from "../utils/user-management-error-messages";

const PAGE_SIZE = 10;
const STATUS_OPTIONS = ["ALL", "INVITED", "ACTIVE", "SUSPENDED", "DEACTIVATED"] as const;
const columnHelper = createColumnHelper<UserResponseDto>();

function userDisplayName(user: UserResponseDto): string {
  return user.displayName ?? `${user.firstName} ${user.lastName}`;
}

export function UserListScreen() {
  const router = useRouter();
  const { tenantUuid } = useCurrentTenant();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("ALL");
  const [companyFilter, setCompanyFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Light debounce — searchUsers is a real network call (unlike
  // Organization's client-side-only search), so we avoid firing one per
  // keystroke without reaching for a new dependency.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const isSearching = debouncedSearch.length > 0;
  const listQuery = useUsers(companyFilter || undefined);
  const searchQuery = useUserSearch(debouncedSearch);
  const activeQuery = isSearching ? searchQuery : listQuery;
  const companiesQuery = useCompanyOptions(tenantUuid);
  const inviteUser = useInviteUser();

  const companyNameByUuid = useMemo(() => {
    const map = new Map<string, string>();
    (companiesQuery.data ?? []).forEach((company) => map.set(company.uuid, company.companyCode));
    return map;
  }, [companiesQuery.data]);

  const filtered = useMemo(() => {
    const users = activeQuery.data ?? [];
    if (statusFilter === "ALL") {
      return users;
    }
    return users.filter((user) => user.status === statusFilter);
  }, [activeQuery.data, statusFilter]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "name",
        header: "Name",
        cell: (info) => userDisplayName(info.row.original),
      }),
      columnHelper.accessor("email", { header: "Email" }),
      columnHelper.display({
        id: "company",
        header: "Company",
        cell: (info) => companyNameByUuid.get(info.row.original.companyUuid) ?? info.row.original.companyUuid,
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
    ],
    [companyNameByUuid],
  );

  return (
    <div>
      <PageHeader title="User Management" description="Invite, manage, and control access for your Tenant's Users." />
      <Toolbar
        actions={
          <LoadingButton
            isLoading={false}
            leadingIcon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            Invite User
          </LoadingButton>
        }
        filters={
          <>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as (typeof STATUS_OPTIONS)[number]);
                setPage(1);
              }}
              aria-label="Filter by status"
              className="rounded-xl border border-surface-border bg-surface-sunken px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL" ? "All Statuses" : status}
                </option>
              ))}
            </select>
            <select
              value={companyFilter}
              onChange={(event) => {
                setCompanyFilter(event.target.value);
                setPage(1);
              }}
              disabled={!tenantUuid || (companiesQuery.data ?? []).length === 0}
              aria-label="Filter by company"
              className="rounded-xl border border-surface-border bg-surface-sunken px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">All Companies</option>
              {(companiesQuery.data ?? []).map((company) => (
                <option key={company.uuid} value={company.uuid}>
                  {company.companyCode} — {company.legalName}
                </option>
              ))}
            </select>
          </>
        }
      >
        <SearchBox
          value={searchInput}
          onChange={(value) => {
            setSearchInput(value);
            setPage(1);
          }}
          placeholder="Search by name or email…"
        />
      </Toolbar>

      <DataTable
        columns={columns}
        data={paged}
        isLoading={activeQuery.isLoading}
        isError={activeQuery.isError}
        errorMessage={getUserManagementErrorMessage(activeQuery.error)}
        emptyIcon={<UsersIcon className="h-6 w-6" />}
        emptyTitle={isSearching ? "No Users match your search" : "No Users yet"}
        emptyDescription={
          isSearching ? "Try a different search term." : "Invite your first User to get started."
        }
        emptyAction={
          !isSearching && (
            <LoadingButton isLoading={false} onClick={() => setIsCreateOpen(true)}>
              Invite User
            </LoadingButton>
          )
        }
        onRowClick={(user) => router.push(`/users/${user.uuid}`)}
        getRowKey={(user) => user.uuid}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />

      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Invite User"
        description="Add a new User to this Tenant. They will start in Invited status."
      >
        <UserForm
          submitLabel="Send Invite"
          isSubmitting={inviteUser.isPending}
          serverError={getUserManagementErrorMessage(inviteUser.error)}
          fieldErrors={inviteUser.error?.details}
          onSubmit={(values) =>
            inviteUser.mutate(
              {
                ...values,
                branchUuid: values.branchUuid || null,
                departmentUuid: values.departmentUuid || null,
                middleName: values.middleName || null,
                displayName: values.displayName || null,
                mobileNumber: values.mobileNumber || null,
              },
              { onSuccess: () => setIsCreateOpen(false) },
            )
          }
        />
      </Drawer>
    </div>
  );
}
