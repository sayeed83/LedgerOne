"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import { BatchStatus, type BatchResponseDto } from "@ledgerone/shared-types";
import { Drawer, ListIcon, LoadingButton, PencilIcon, PlusIcon } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchBox } from "@/components/ui/SearchBox";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { useCurrentCompany } from "@/hooks/use-current-company";
import { useBatches } from "../hooks/use-batches";
import { useWarehouses } from "../hooks/use-warehouses";
import { useCreateBatch } from "../hooks/use-create-batch";
import { BatchForm } from "../components/BatchForm";
import { BranchSelect } from "../components/BranchSelect";
import { WarehouseSelect } from "../components/WarehouseSelect";
import { CompanyContextBar } from "../components/CompanyContextBar";
import { getInventoryErrorMessage } from "../utils/inventory-error-messages";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

const PAGE_SIZE = 10;
const columnHelper = createColumnHelper<BatchResponseDto>();

// Mirrors InventoryAdjustmentListScreen.tsx's exact pattern —
// `listBatchesByWarehouse` (both Business and Repository layers) is
// Warehouse-scoped, and Warehouse itself is Branch-scoped (WHS-001), so
// this list screen chains the same Company → Branch → Warehouse selectors
// Inventory Adjustment's/Stock's own list screens use (all three already
// exist and are reused as-is), kept as local screen state exactly like
// those screens' own `branchUuid`/`warehouseUuid` state.
export function BatchListScreen() {
  const { companyUuid } = useCurrentCompany();
  const [branchUuid, setBranchUuid] = useState("");
  const [warehouseUuid, setWarehouseUuid] = useState("");

  return (
    <div>
      <PageHeader
        title="Batches"
        description="Track Batch/Lot-level Stock for expiry management and traceability (Ch.40)."
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
        <BatchesTable companyUuid={companyUuid} branchUuid={branchUuid} warehouseUuid={warehouseUuid} />
      )}
    </div>
  );
}

function BatchesTable({
  companyUuid,
  branchUuid,
  warehouseUuid,
}: {
  companyUuid: string;
  branchUuid: string;
  warehouseUuid: string;
}) {
  const router = useRouter();
  const batchesQuery = useBatches(warehouseUuid);
  // Every row in this table shares the one active Warehouse (the list is
  // Warehouse-scoped, per `listBatchesByWarehouse`'s own shape) — this
  // lookup exists only to render a friendly "code — name" label for the
  // Warehouse column below instead of a raw uuid, reusing the
  // already-fetched `WarehouseSelect` query (same `warehousesQueryKey`, so
  // React Query serves this from cache rather than firing a second
  // request), mirroring InventoryAdjustmentListScreen's identical technique.
  const warehousesQuery = useWarehouses(branchUuid);
  const createBatch = useCreateBatch(warehouseUuid);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const batches = batchesQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return batches;
    }
    return batches.filter(
      (batch) => batch.batchNumber.toLowerCase().includes(term) || batch.productId.toLowerCase().includes(term),
    );
  }, [batchesQuery.data, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const warehouseLabel = useMemo(() => {
    const warehouse = (warehousesQuery.data ?? []).find((candidate) => candidate.uuid === warehouseUuid);
    return warehouse ? `${warehouse.warehouseCode} — ${warehouse.name}` : warehouseUuid;
  }, [warehousesQuery.data, warehouseUuid]);

  const columns = useMemo(
    () => [
      // Flagged known backend gap (see batch.dto.ts's own header comment):
      // `BatchResponseDto` carries a raw internal `productId`, not a
      // `productUuid` — there is no Product-name lookup available for this
      // column to resolve against, so the Product ID is shown as-is
      // (identical to Stock's/Inventory Adjustment's own Product column).
      columnHelper.accessor("productId", { header: "Product" }),
      columnHelper.display({
        id: "warehouse",
        header: "Warehouse",
        cell: () => warehouseLabel,
      }),
      columnHelper.accessor("batchNumber", { header: "Batch Number" }),
      columnHelper.accessor("manufactureDate", { header: "Manufacture Date", cell: (info) => formatDate(info.getValue()) }),
      columnHelper.accessor("expiryDate", { header: "Expiry Date", cell: (info) => formatDate(info.getValue()) }),
      columnHelper.accessor("quantity", { header: "Quantity" }),
      columnHelper.accessor("status", { header: "Status" }),
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
              router.push(`/inventory/batches/${info.row.original.uuid}`);
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
            New Batch
          </LoadingButton>
        }
      >
        <SearchBox
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by batch number or Product ID…"
        />
      </Toolbar>

      <DataTable
        columns={columns}
        data={paged}
        isLoading={batchesQuery.isLoading}
        isError={batchesQuery.isError}
        errorMessage={getInventoryErrorMessage(batchesQuery.error)}
        emptyIcon={<ListIcon className="h-6 w-6" />}
        emptyTitle={search ? "No Batches match your search" : "No Batches yet"}
        emptyDescription={search ? "Try a different search term." : "Record the first Batch for this Warehouse."}
        emptyAction={
          !search && (
            <LoadingButton isLoading={false} onClick={() => setIsCreateOpen(true)}>
              New Batch
            </LoadingButton>
          )
        }
        onRowClick={(batch) => router.push(`/inventory/batches/${batch.uuid}`)}
        getRowKey={(batch) => batch.uuid}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />

      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Batch"
        description="Record a new Batch/Lot for a Product held in this Warehouse."
      >
        <BatchForm
          companyUuid={companyUuid}
          branchUuid={branchUuid}
          defaultValues={{
            companyUuid,
            branchUuid,
            warehouseUuid,
            productId: "",
            batchNumber: "",
            manufactureDate: "",
            expiryDate: "",
            quantity: "",
            status: BatchStatus.Active,
          }}
          submitLabel="Create Batch"
          isSubmitting={createBatch.isPending}
          serverError={getInventoryErrorMessage(createBatch.error)}
          fieldErrors={createBatch.error?.details}
          onSubmit={(values) =>
            createBatch.mutate(
              {
                companyUuid: values.companyUuid,
                warehouseUuid: values.warehouseUuid,
                productId: values.productId,
                batchNumber: values.batchNumber,
                manufactureDate: values.manufactureDate,
                expiryDate: values.expiryDate,
                quantity: values.quantity,
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
