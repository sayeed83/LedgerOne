"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import type { RoleResponseDto } from "@ledgerone/shared-types";
import { Badge, Drawer, KeyIcon, LoadingButton, PlusIcon } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchBox } from "@/components/ui/SearchBox";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { useRoles, useCreateRole } from "../hooks/use-roles";
import { RoleForm } from "../components/RoleForm";
import { getAuthorizationErrorMessage } from "../utils/authorization-error-messages";

const PAGE_SIZE = 10;
const columnHelper = createColumnHelper<RoleResponseDto>();

// Mirrors TaxScreen.tsx's own pattern (its closest analog: a plain,
// unpaginated, tenant-wide reference-data list with create-via-Drawer) —
// Role is tenant-scoped, not Company-scoped, so there is no
// `CompanyContextBar` here at all (00_BUSINESS_RULES.md Ch.11).
export function RolesScreen() {
  const router = useRouter();
  const rolesQuery = useRoles();
  const createRole = useCreateRole();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const roles = rolesQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return roles;
    }
    return roles.filter((role) => role.name.toLowerCase().includes(term));
  }, [rolesQuery.data, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", { header: "Name" }),
      columnHelper.accessor("isSystemRole", {
        header: "System",
        cell: (info) => (info.getValue() ? <Badge variant="default">System</Badge> : "—"),
      }),
      columnHelper.accessor("status", { header: "Status", cell: (info) => <StatusBadge status={info.getValue()} /> }),
    ],
    [],
  );

  return (
    <div>
      <PageHeader title="Roles" description="Manage Roles and the Permissions granted to each." />

      <Toolbar
        actions={
          <LoadingButton
            isLoading={false}
            leadingIcon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            New Role
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
        isLoading={rolesQuery.isLoading}
        isError={rolesQuery.isError}
        errorMessage={getAuthorizationErrorMessage(rolesQuery.error)}
        emptyIcon={<KeyIcon className="h-6 w-6" />}
        emptyTitle={search ? "No Roles match your search" : "No Roles yet"}
        emptyDescription={search ? "Try a different search term." : "Create your first Role to get started."}
        emptyAction={
          !search && (
            <LoadingButton isLoading={false} onClick={() => setIsCreateOpen(true)}>
              New Role
            </LoadingButton>
          )
        }
        onRowClick={(role) => router.push(`/authorization/roles/${role.uuid}`)}
        getRowKey={(role) => role.uuid}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />

      <Drawer isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Role" description="Create a Role for this Tenant.">
        <RoleForm
          submitLabel="Create Role"
          isSubmitting={createRole.isPending}
          serverError={getAuthorizationErrorMessage(createRole.error)}
          fieldErrors={createRole.error?.details}
          onSubmit={(values) => createRole.mutate(values, { onSuccess: () => setIsCreateOpen(false) })}
        />
      </Drawer>
    </div>
  );
}
