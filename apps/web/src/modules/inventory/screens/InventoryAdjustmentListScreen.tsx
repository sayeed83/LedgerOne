"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import { AdjustmentType, type InventoryAdjustmentResponseDto } from "@ledgerone/shared-types";
import { Drawer, ListIcon, LoadingButton, PencilIcon, PlusIcon } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchBox } from "@/components/ui/SearchBox";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { useCurrentCompany } from "@/hooks/use-current-company";
import { useInventoryAdjustments } from "../hooks/use-inventory-adjustments";
import { useWarehouses } from "../hooks/use-warehouses";
import { useCreateInventoryAdjustment } from "../hooks/use-create-inventory-adjustment";
import { InventoryAdjustmentForm } from "../components/InventoryAdjustmentForm";
import { BranchSelect } from "../components/BranchSelect";
import { WarehouseSelect } from "../components/WarehouseSelect";
import { CompanyContextBar } from "../components/CompanyContextBar";
import { getInventoryErrorMessage } from "../utils/inventory-error-messages";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

const PAGE_SIZE = 10;
const columnHelper = createColumnHelper<InventoryAdjustmentResponseDto>();

// Mirrors StockListScreen.tsx's exact pattern — `listInventoryAdjustmentsByWarehouse`
// (both Business and Repository layers) is Warehouse-scoped, and Warehouse
// itself is Branch-scoped (WHS-001), so this list screen chains the same
// Company → Branch → Warehouse selectors Stock's own list screen uses (all
// three already exist and are reused as-is), kept as local screen state
// exactly like StockListScreen's own `branchUuid`/`warehouseUuid` state.
export function InventoryAdjustmentListScreen() {
  const { companyUuid } = useCurrentCompany();
  const [branchUuid, setBranchUuid] = useState("");
  const [warehouseUuid, setWarehouseUuid] = useState("");

  return (
    <div>
      <PageHeader
        title="Inventory Adjustments"
        description="Record manual corrections to a Product's Stock quantity in a Warehouse."
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
        <InventoryAdjustmentsTable companyUuid={companyUuid} branchUuid={branchUuid} warehouseUuid={warehouseUuid} />
      )}
    </div>
  );
}

function InventoryAdjustmentsTable({
  companyUuid,
  branchUuid,
  warehouseUuid,
}: {
  companyUuid: string;
  branchUuid: string;
  warehouseUuid: string;
}) {
  const router = useRouter();
  const adjustmentsQuery = useInventoryAdjustments(warehouseUuid);
  // Every row in this table shares the one active Warehouse (the list is
  // Warehouse-scoped, per `listInventoryAdjustmentsByWarehouse`'s own shape)
  // — this lookup exists only to render a friendly "code — name" label for
  // the Warehouse column below instead of a raw uuid, reusing the
  // already-fetched `WarehouseSelect` query (same `warehousesQueryKey`, so
  // React Query serves this from cache rather than firing a second
  // request), mirroring StockListScreen's identical technique.
  const warehousesQuery = useWarehouses(branchUuid);
  const createInventoryAdjustment = useCreateInventoryAdjustment(warehouseUuid);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const adjustments = adjustmentsQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return adjustments;
    }
    return adjustments.filter(
      (adjustment) =>
        adjustment.reason.toLowerCase().includes(term) || adjustment.productId.toLowerCase().includes(term),
    );
  }, [adjustmentsQuery.data, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const warehouseLabel = useMemo(() => {
    const warehouse = (warehousesQuery.data ?? []).find((candidate) => candidate.uuid === warehouseUuid);
    return warehouse ? `${warehouse.warehouseCode} — ${warehouse.name}` : warehouseUuid;
  }, [warehousesQuery.data, warehouseUuid]);

  const columns = useMemo(
    () => [
      // Flagged known backend gap (see inventory-adjustment.dto.ts's own
      // header comment): `InventoryAdjustmentResponseDto` carries a raw
      // internal `productId`, not a `productUuid` — there is no Product-name
      // lookup available for this column to resolve against, so the Product
      // ID is shown as-is (identical to Stock's own Product column).
      columnHelper.accessor("productId", { header: "Product" }),
      columnHelper.display({
        id: "warehouse",
        header: "Warehouse",
        cell: () => warehouseLabel,
      }),
      columnHelper.accessor("adjustmentType", { header: "Adjustment Type" }),
      columnHelper.accessor("quantity", { header: "Quantity" }),
      columnHelper.accessor("reason", { header: "Reason" }),
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
              router.push(`/inventory/adjustments/${info.row.original.uuid}`);
            }}
          >
            Edit
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
            New Adjustment
          </LoadingButton>
        }
      >
        <SearchBox
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by reason or Product ID…"
        />
      </Toolbar>

      <DataTable
        columns={columns}
        data={paged}
        isLoading={adjustmentsQuery.isLoading}
        isError={adjustmentsQuery.isError}
        errorMessage={getInventoryErrorMessage(adjustmentsQuery.error)}
        emptyIcon={<ListIcon className="h-6 w-6" />}
        emptyTitle={search ? "No Inventory Adjustments match your search" : "No Inventory Adjustments yet"}
        emptyDescription={
          search ? "Try a different search term." : "Record the first Inventory Adjustment for this Warehouse."
        }
        emptyAction={
          !search && (
            <LoadingButton isLoading={false} onClick={() => setIsCreateOpen(true)}>
              New Adjustment
            </LoadingButton>
          )
        }
        onRowClick={(adjustment) => router.push(`/inventory/adjustments/${adjustment.uuid}`)}
        getRowKey={(adjustment) => adjustment.uuid}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />

      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Inventory Adjustment"
        description="Record a manual correction to a Product's Stock quantity in this Warehouse."
      >
        <InventoryAdjustmentForm
          companyUuid={companyUuid}
          branchUuid={branchUuid}
          defaultValues={{
            companyUuid,
            branchUuid,
            warehouseUuid,
            productId: "",
            adjustmentType: AdjustmentType.Increase,
            quantity: "",
            reason: "",
            remarks: "",
          }}
          submitLabel="Create Adjustment"
          isSubmitting={createInventoryAdjustment.isPending}
          serverError={getInventoryErrorMessage(createInventoryAdjustment.error)}
          fieldErrors={createInventoryAdjustment.error?.details}
          onSubmit={(values) =>
            createInventoryAdjustment.mutate(
              {
                companyUuid: values.companyUuid,
                warehouseUuid: values.warehouseUuid,
                productId: values.productId,
                adjustmentType: values.adjustmentType,
                quantity: values.quantity,
                reason: values.reason,
                remarks: values.remarks,
              },
              { onSuccess: () => setIsCreateOpen(false) },
            )
          }
        />
      </Drawer>
    </div>
  );
}
