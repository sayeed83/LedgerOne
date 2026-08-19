"use client";

import { useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import type { PermissionResponseDto } from "@ledgerone/shared-types";
import { ShieldCheckIcon } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchBox } from "@/components/ui/SearchBox";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { usePermissions } from "../hooks/use-permissions";
import { getAuthorizationErrorMessage } from "../utils/authorization-error-messages";

const PAGE_SIZE = 10;
const columnHelper = createColumnHelper<PermissionResponseDto>();

// Permission is platform-owned, read-only reference data (MT-005/PRM-001) —
// no create/edit/delete anywhere, this screen is a browsable catalog only.
// Granting a Permission to a Role happens on that Role's own detail screen
// (`RoleDetailScreen.tsx`'s `RolePermissionAssignment`), not here.
export function PermissionsScreen() {
  const permissionsQuery = usePermissions();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const permissions = permissionsQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return permissions;
    }
    return permissions.filter(
      (permission) =>
        permission.permissionKey.toLowerCase().includes(term) ||
        permission.moduleName.toLowerCase().includes(term) ||
        permission.resource.toLowerCase().includes(term),
    );
  }, [permissionsQuery.data, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = useMemo(
    () => [
      columnHelper.accessor("permissionKey", { header: "Permission Key" }),
      columnHelper.accessor("moduleName", { header: "Module" }),
      columnHelper.accessor("resource", { header: "Resource" }),
      columnHelper.accessor("action", { header: "Action" }),
    ],
    [],
  );

  return (
    <div>
      <PageHeader title="Permissions" description="Browse the platform's Permission catalog." />

      <Toolbar>
        <SearchBox
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by key, module, or resource…"
        />
      </Toolbar>

      <DataTable
        columns={columns}
        data={paged}
        isLoading={permissionsQuery.isLoading}
        isError={permissionsQuery.isError}
        errorMessage={getAuthorizationErrorMessage(permissionsQuery.error)}
        emptyIcon={<ShieldCheckIcon className="h-6 w-6" />}
        emptyTitle={search ? "No Permissions match your search" : "No Permissions in the catalog yet"}
        emptyDescription={
          search
            ? "Try a different search term."
            : "No Permissions have been seeded or registered on the platform yet."
        }
        getRowKey={(permission) => permission.uuid}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />
    </div>
  );
}
