"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import type { WarehouseResponseDto } from "@ledgerone/shared-types";
import { Drawer, ListIcon, LoadingButton, PlusIcon } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchBox } from "@/components/ui/SearchBox";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCurrentCompany } from "@/hooks/use-current-company";
import { useWarehouses } from "../hooks/use-warehouses";
import { useCreateWarehouse } from "../hooks/use-create-warehouse";
import { WarehouseForm } from "../components/WarehouseForm";
import { BranchSelect } from "../components/BranchSelect";
import { CompanyContextBar } from "../components/CompanyContextBar";
import { getInventoryErrorMessage } from "../utils/inventory-error-messages";

const PAGE_SIZE = 10;
const columnHelper = createColumnHelper<WarehouseResponseDto>();

// Mirrors ProductListScreen.tsx's exact pattern. Warehouse's real parent is
// Branch, not Company (WHS-001/Ch.37.9) — one extra scoping level beyond
// Product's Company-only context, so a Branch selector sits alongside the
// existing `CompanyContextBar` rather than replacing it (no shared "current
// Branch" context exists platform-wide yet, so the selected Branch is kept
// as local screen state, scoped by the active Company).
export function WarehouseListScreen() {
  const { companyUuid } = useCurrentCompany();
  const [branchUuid, setBranchUuid] = useState("");

  return (
    <div>
      <PageHeader title="Warehouses" description="Manage the physical stock-keeping locations within a Branch." />
      <CompanyContextBar />

      {companyUuid && (
        <div className="mb-6 max-w-sm">
          <BranchSelect
            label="Active Branch"
            companyUuid={companyUuid}
            value={branchUuid}
            onChange={setBranchUuid}
          />
        </div>
      )}

      {companyUuid && branchUuid && <WarehousesTable companyUuid={companyUuid} branchUuid={branchUuid} />}
    </div>
  );
}

function WarehousesTable({ companyUuid, branchUuid }: { companyUuid: string; branchUuid: string }) {
  const router = useRouter();
  const warehousesQuery = useWarehouses(branchUuid);
  const createWarehouse = useCreateWarehouse(branchUuid);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const warehouses = warehousesQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return warehouses;
    }
    return warehouses.filter(
      (warehouse) =>
        warehouse.name.toLowerCase().includes(term) || warehouse.warehouseCode.toLowerCase().includes(term),
    );
  }, [warehousesQuery.data, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = useMemo(
    () => [
      columnHelper.accessor("warehouseCode", { header: "Code" }),
      columnHelper.accessor("name", { header: "Name" }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
    ],
    [],
  );

  return (
    <div>
      <Toolbar
        actions={
          <LoadingButton
            isLoading={false}
            leadingIcon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            New Warehouse
          </LoadingButton>
        }
      >
        <SearchBox
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by name or code…"
        />
      </Toolbar>

      <DataTable
        columns={columns}
        data={paged}
        isLoading={warehousesQuery.isLoading}
        isError={warehousesQuery.isError}
        errorMessage={getInventoryErrorMessage(warehousesQuery.error)}
        emptyIcon={<ListIcon className="h-6 w-6" />}
        emptyTitle={search ? "No Warehouses match your search" : "No Warehouses yet"}
        emptyDescription={search ? "Try a different search term." : "Create your first Warehouse to get started."}
        emptyAction={
          !search && (
            <LoadingButton isLoading={false} onClick={() => setIsCreateOpen(true)}>
              New Warehouse
            </LoadingButton>
          )
        }
        onRowClick={(warehouse) => router.push(`/inventory/warehouses/${warehouse.uuid}`)}
        getRowKey={(warehouse) => warehouse.uuid}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />

      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Warehouse"
        description="Create a Warehouse for this Branch."
      >
        <WarehouseForm
          companyUuid={companyUuid}
          branchUuid={branchUuid}
          submitLabel="Create Warehouse"
          isSubmitting={createWarehouse.isPending}
          serverError={getInventoryErrorMessage(createWarehouse.error)}
          fieldErrors={createWarehouse.error?.details}
          onSubmit={(values) =>
            createWarehouse.mutate(
              {
                branchUuid: values.branchUuid,
                warehouseCode: values.warehouseCode,
                name: values.name,
                description: values.description,
                status: values.status,
              },
              { onSuccess: () => setIsCreateOpen(false) },
            )
          }
        />
      </Drawer>
    </div>
  );
}
