"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import type { ReorderLevelResponseDto } from "@ledgerone/shared-types";
import { Drawer, ListIcon, LoadingButton, PencilIcon, PlusIcon } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchBox } from "@/components/ui/SearchBox";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { useCurrentCompany } from "@/hooks/use-current-company";
import { useReorderLevelsByCompany, useReorderLevelsByWarehouse } from "../hooks/use-reorder-levels";
import { useWarehouses } from "../hooks/use-warehouses";
import { useCompaniesForSelect } from "../hooks/use-companies-for-select";
import { useCreateReorderLevel } from "../hooks/use-create-reorder-level";
import { ReorderLevelForm } from "../components/ReorderLevelForm";
import { BranchSelect } from "../components/BranchSelect";
import { WarehouseSelect } from "../components/WarehouseSelect";
import { CompanyContextBar } from "../components/CompanyContextBar";
import { getInventoryErrorMessage } from "../utils/inventory-error-messages";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

const PAGE_SIZE = 10;
const columnHelper = createColumnHelper<ReorderLevelResponseDto>();

// Mirrors BatchListScreen.tsx's exact pattern — `listReorderLevelsByWarehouse`
// (both Business and Repository layers) is Warehouse-scoped, and Warehouse
// itself is Branch-scoped (WHS-001), so this list screen chains the same
// Company → Branch → Warehouse selectors Batch's/Inventory Adjustment's own
// list screens use (all three already exist and are reused as-is), kept as
// local screen state exactly like those screens' own
// `branchUuid`/`warehouseUuid` state.
//
// `listReorderLevelsByCompany` (the module's bare, Company-scoped list route
// — see the backend's own list-reorder-levels-by-company.controller.ts
// header comment) is used here for a Company-wide total, surfaced in the
// page description, so both of the backend's authorized list endpoints are
// genuinely exercised.
export function ReorderLevelListScreen() {
  const { companyUuid } = useCurrentCompany();
  const [branchUuid, setBranchUuid] = useState("");
  const [warehouseUuid, setWarehouseUuid] = useState("");

  const companyReorderLevelsQuery = useReorderLevelsByCompany(companyUuid);
  const companyTotal = companyReorderLevelsQuery.data?.length;

  return (
    <div>
      <PageHeader
        title="Reorder Levels"
        description={
          companyTotal !== undefined
            ? `Configure minimum Stock thresholds per Product per Warehouse (Ch.42). ${companyTotal} configured for this Company.`
            : "Configure minimum Stock thresholds per Product per Warehouse (Ch.42)."
        }
      />
      <CompanyContextBar />

      {companyUuid && (
        <div className="mb-6 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          <BranchSelect
            label="Active Branch"
            companyUuid={companyUuid}
            value={branchUuid}
            onChange={(value) => {
              setBranchUuid(value);
              setWarehouseUuid("");
            }}
          />
          <WarehouseSelect
            label="Active Warehouse"
            branchUuid={branchUuid}
            value={warehouseUuid}
            onChange={setWarehouseUuid}
          />
        </div>
      )}

      {companyUuid && branchUuid && warehouseUuid && (
        <ReorderLevelsTable companyUuid={companyUuid} branchUuid={branchUuid} warehouseUuid={warehouseUuid} />
      )}
    </div>
  );
}

function ReorderLevelsTable({
  companyUuid,
  branchUuid,
  warehouseUuid,
}: {
  companyUuid: string;
  branchUuid: string;
  warehouseUuid: string;
}) {
  const router = useRouter();
  const reorderLevelsQuery = useReorderLevelsByWarehouse(warehouseUuid);
  // Every row in this table shares the one active Warehouse (the list is
  // Warehouse-scoped, per `listReorderLevelsByWarehouse`'s own shape) — this
  // lookup exists only to render a friendly "code — name" label for the
  // Warehouse column below instead of a raw uuid, reusing the
  // already-fetched `WarehouseSelect` query (same `warehousesQueryKey`, so
  // React Query serves this from cache rather than firing a second
  // request), mirroring BatchListScreen's identical technique.
  const warehousesQuery = useWarehouses(branchUuid);
  // Every row in this table shares the one active Company too — reuses
  // `CompanyContextBar`'s/`CompanySelect`'s own already-fetched query (same
  // cache key), purely to render a friendly "code — legalName" label instead
  // of a raw uuid for the Company column below.
  const companiesQuery = useCompaniesForSelect();
  const createReorderLevel = useCreateReorderLevel(companyUuid, warehouseUuid);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const reorderLevels = reorderLevelsQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return reorderLevels;
    }
    return reorderLevels.filter((reorderLevel) => reorderLevel.productId.toLowerCase().includes(term));
  }, [reorderLevelsQuery.data, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const warehouseLabel = useMemo(() => {
    const warehouse = (warehousesQuery.data ?? []).find((candidate) => candidate.uuid === warehouseUuid);
    return warehouse ? `${warehouse.warehouseCode} — ${warehouse.name}` : warehouseUuid;
  }, [warehousesQuery.data, warehouseUuid]);

  const companyLabel = useMemo(() => {
    const company = (companiesQuery.data ?? []).find((candidate) => candidate.uuid === companyUuid);
    return company ? `${company.companyCode} — ${company.legalName}` : companyUuid;
  }, [companiesQuery.data, companyUuid]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "company",
        header: "Company",
        cell: () => companyLabel,
      }),
      columnHelper.display({
        id: "warehouse",
        header: "Warehouse",
        cell: () => warehouseLabel,
      }),
      // Flagged known backend gap (see reorder-level.dto.ts's own header
      // comment): `ReorderLevelResponseDto` carries a raw internal
      // `productId`, not a `productUuid` — there is no Product-name lookup
      // available for this column to resolve against, so the Product ID is
      // shown as-is (identical to Batch's/Stock's/Inventory Adjustment's own
      // Product column).
      columnHelper.accessor("productId", { header: "Product" }),
      columnHelper.accessor("reorderLevel", { header: "Reorder Level" }),
      columnHelper.accessor("reorderQuantity", { header: "Reorder Quantity" }),
      columnHelper.accessor("createdAt", { header: "Created At", cell: (info) => formatDateTime(info.getValue()) }),
      columnHelper.accessor("updatedAt", { header: "Updated At", cell: (info) => formatDateTime(info.getValue()) }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => (
          <LoadingButton
            variant="ghost"
            size="sm"
            isLoading={false}
            leadingIcon={<PencilIcon className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              router.push(`/inventory/reorder-levels/${info.row.original.uuid}`);
            }}
          >
            Edit
          </LoadingButton>
        ),
      }),
    ],
    [companyLabel, router, warehouseLabel],
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
            New Reorder Level
          </LoadingButton>
        }
      >
        <SearchBox
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by Product ID…"
        />
      </Toolbar>

      <DataTable
        columns={columns}
        data={paged}
        isLoading={reorderLevelsQuery.isLoading}
        isError={reorderLevelsQuery.isError}
        errorMessage={getInventoryErrorMessage(reorderLevelsQuery.error)}
        emptyIcon={<ListIcon className="h-6 w-6" />}
        emptyTitle={search ? "No Reorder Levels match your search" : "No Reorder Levels yet"}
        emptyDescription={search ? "Try a different search term." : "Define the first Reorder Level for this Warehouse."}
        emptyAction={
          !search && (
            <LoadingButton isLoading={false} onClick={() => setIsCreateOpen(true)}>
              New Reorder Level
            </LoadingButton>
          )
        }
        onRowClick={(reorderLevel) => router.push(`/inventory/reorder-levels/${reorderLevel.uuid}`)}
        getRowKey={(reorderLevel) => reorderLevel.uuid}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />

      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Reorder Level"
        description="Define a new Reorder Level for a Product in this Warehouse."
      >
        <ReorderLevelForm
          companyUuid={companyUuid}
          branchUuid={branchUuid}
          defaultValues={{
            companyUuid,
            branchUuid,
            warehouseUuid,
            productId: "",
            reorderLevel: "",
            reorderQuantity: "",
          }}
          submitLabel="Create Reorder Level"
          isSubmitting={createReorderLevel.isPending}
          serverError={getInventoryErrorMessage(createReorderLevel.error)}
          fieldErrors={createReorderLevel.error?.details}
          onSubmit={(values) =>
            createReorderLevel.mutate(
              {
                companyUuid: values.companyUuid,
                warehouseUuid: values.warehouseUuid,
                productId: values.productId,
                reorderLevel: values.reorderLevel,
                reorderQuantity: values.reorderQuantity,
              },
              { onSuccess: () => setIsCreateOpen(false) },
            )
          }
        />
      </Drawer>
    </div>
  );
}
