"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import type { StockMovementResponseDto } from "@ledgerone/shared-types";
import { Drawer, EyeIcon, ListIcon, LoadingButton, PlusIcon } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchBox } from "@/components/ui/SearchBox";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { useCurrentCompany } from "@/hooks/use-current-company";
import { useStockMovements } from "../hooks/use-stock-movements";
import { useWarehouses } from "../hooks/use-warehouses";
import { useCreateStockMovement } from "../hooks/use-create-stock-movement";
import { StockMovementForm } from "../components/StockMovementForm";
import { BranchSelect } from "../components/BranchSelect";
import { WarehouseSelect } from "../components/WarehouseSelect";
import { CompanyContextBar } from "../components/CompanyContextBar";
import { getInventoryErrorMessage } from "../utils/inventory-error-messages";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

const PAGE_SIZE = 10;
const columnHelper = createColumnHelper<StockMovementResponseDto>();

// Mirrors InventoryAdjustmentListScreen.tsx's exact pattern —
// `listStockMovementsByWarehouse` (both Business and Repository layers) is
// Warehouse-scoped (matching either `sourceWarehouseUuid` or
// `destinationWarehouseUuid`, Ch.39.10), and Warehouse itself is
// Branch-scoped (WHS-001), so this list screen chains the same
// Company → Branch → Warehouse selectors Inventory Adjustment's/Stock's own
// list screens use (all three already exist and are reused as-is). No Edit
// action exists in this table — Stock Movement is immutable once recorded
// (Ch.39.5/STM-002) — the Actions column offers only a read-only "View"
// link to the Detail screen.
export function StockMovementListScreen() {
  const { companyUuid } = useCurrentCompany();
  const [branchUuid, setBranchUuid] = useState("");
  const [warehouseUuid, setWarehouseUuid] = useState("");

  return (
    <div>
      <PageHeader
        title="Stock Movements"
        description="The immutable ledger of every quantity change to Stock — Receipts, Issues, Transfers, and Adjustments."
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
          <WarehouseSelect label="Active Warehouse" branchUuid={branchUuid} value={warehouseUuid} onChange={setWarehouseUuid} />
        </div>
      )}

      {companyUuid && branchUuid && warehouseUuid && (
        <StockMovementsTable companyUuid={companyUuid} branchUuid={branchUuid} warehouseUuid={warehouseUuid} />
      )}
    </div>
  );
}

function StockMovementsTable({
  companyUuid,
  branchUuid,
  warehouseUuid,
}: {
  companyUuid: string;
  branchUuid: string;
  warehouseUuid: string;
}) {
  const router = useRouter();
  const movementsQuery = useStockMovements(warehouseUuid);
  // Resolves both `sourceWarehouseUuid`/`destinationWarehouseUuid` to a
  // friendly "code — name" label instead of a raw uuid, reusing the
  // already-fetched `WarehouseSelect` query (same `warehousesQueryKey`, so
  // React Query serves this from cache rather than firing a second
  // request), mirroring InventoryAdjustmentListScreen's identical technique.
  const warehousesQuery = useWarehouses(branchUuid);
  const createStockMovement = useCreateStockMovement(warehouseUuid);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const warehouseLabel = useMemo(() => {
    const byUuid = new Map((warehousesQuery.data ?? []).map((warehouse) => [warehouse.uuid, warehouse]));
    return (uuid: string | null) => {
      if (!uuid) {
        return "—";
      }
      const warehouse = byUuid.get(uuid);
      return warehouse ? `${warehouse.warehouseCode} — ${warehouse.name}` : uuid;
    };
  }, [warehousesQuery.data]);

  const filtered = useMemo(() => {
    const movements = movementsQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return movements;
    }
    return movements.filter(
      (movement) =>
        movement.productId.toLowerCase().includes(term) ||
        (movement.referenceType ?? "").toLowerCase().includes(term) ||
        (movement.referenceUuid ?? "").toLowerCase().includes(term),
    );
  }, [movementsQuery.data, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = useMemo(
    () => [
      columnHelper.accessor("movementType", { header: "Movement Type" }),
      // Flagged known backend gap (see stock-movement.dto.ts's own header
      // comment): `StockMovementResponseDto` carries a raw internal
      // `productId`, not a `productUuid` — there is no Product-name lookup
      // available for this column to resolve against, so the Product ID is
      // shown as-is (identical to Stock's/Inventory Adjustment's own
      // Product column).
      columnHelper.accessor("productId", { header: "Product" }),
      columnHelper.accessor("sourceWarehouseUuid", {
        header: "Source Warehouse",
        cell: (info) => warehouseLabel(info.getValue()),
      }),
      columnHelper.accessor("destinationWarehouseUuid", {
        header: "Destination Warehouse",
        cell: (info) => warehouseLabel(info.getValue()),
      }),
      columnHelper.accessor("quantity", { header: "Quantity" }),
      columnHelper.accessor("referenceType", { header: "Reference Type", cell: (info) => info.getValue() ?? "—" }),
      columnHelper.accessor("referenceUuid", { header: "Reference UUID", cell: (info) => info.getValue() ?? "—" }),
      columnHelper.accessor("createdAt", { header: "Created At", cell: (info) => formatDateTime(info.getValue()) }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => (
          <LoadingButton
            variant="ghost"
            size="sm"
            isLoading={false}
            leadingIcon={<EyeIcon className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              router.push(`/inventory/stock-movements/${info.row.original.uuid}`);
            }}
          >
            View
          </LoadingButton>
        ),
      }),
    ],
    [router, warehouseLabel],
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
            New Stock Movement
          </LoadingButton>
        }
      >
        <SearchBox
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by Product ID or reference…"
        />
      </Toolbar>

      <DataTable
        columns={columns}
        data={paged}
        isLoading={movementsQuery.isLoading}
        isError={movementsQuery.isError}
        errorMessage={getInventoryErrorMessage(movementsQuery.error)}
        emptyIcon={<ListIcon className="h-6 w-6" />}
        emptyTitle={search ? "No Stock Movements match your search" : "No Stock Movements yet"}
        emptyDescription={
          search ? "Try a different search term." : "Record the first Stock Movement for this Warehouse."
        }
        emptyAction={
          !search && (
            <LoadingButton isLoading={false} onClick={() => setIsCreateOpen(true)}>
              New Stock Movement
            </LoadingButton>
          )
        }
        onRowClick={(movement) => router.push(`/inventory/stock-movements/${movement.uuid}`)}
        getRowKey={(movement) => movement.uuid}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />

      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Stock Movement"
        description="Record a new event that changes a Product's Stock quantity."
      >
        <StockMovementForm
          companyUuid={companyUuid}
          branchUuid={branchUuid}
          isSubmitting={createStockMovement.isPending}
          serverError={getInventoryErrorMessage(createStockMovement.error)}
          fieldErrors={createStockMovement.error?.details}
          onSubmit={(values) =>
            createStockMovement.mutate(
              {
                companyUuid: values.companyUuid,
                productId: values.productId,
                sourceWarehouseUuid: values.sourceWarehouseUuid,
                destinationWarehouseUuid: values.destinationWarehouseUuid,
                movementType: values.movementType,
                quantity: values.quantity,
                referenceType: values.referenceType,
                referenceUuid: values.referenceUuid,
              },
              { onSuccess: () => setIsCreateOpen(false) },
            )
          }
        />
      </Drawer>
    </div>
  );
}
