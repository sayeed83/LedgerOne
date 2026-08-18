"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import type { StockResponseDto } from "@ledgerone/shared-types";
import { Drawer, ListIcon, LoadingButton, PencilIcon, PlusIcon } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchBox } from "@/components/ui/SearchBox";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { useCurrentCompany } from "@/hooks/use-current-company";
import { useStocks } from "../hooks/use-stocks";
import { useWarehouses } from "../hooks/use-warehouses";
import { useCreateStock } from "../hooks/use-create-stock";
import { StockForm } from "../components/StockForm";
import { BranchSelect } from "../components/BranchSelect";
import { WarehouseSelect } from "../components/WarehouseSelect";
import { CompanyContextBar } from "../components/CompanyContextBar";
import { getInventoryErrorMessage } from "../utils/inventory-error-messages";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

const PAGE_SIZE = 10;
const columnHelper = createColumnHelper<StockResponseDto>();

// Mirrors WarehouseListScreen.tsx's exact pattern, with one further scoping
// level: `listStocksByWarehouse` (both Business and Repository layers) is
// Warehouse-scoped, and Warehouse itself is Branch-scoped (WHS-001), so
// Stock's own list screen chains Company → Branch → Warehouse selectors
// (the first two already exist and are reused as-is: `CompanyContextBar`,
// `BranchSelect`; `WarehouseSelect` is the one new selector this milestone
// adds), kept as local screen state exactly like WarehouseListScreen's own
// `branchUuid` state (no shared "current Branch"/"current Warehouse"
// context exists platform-wide yet).
export function StockListScreen() {
  const { companyUuid } = useCurrentCompany();
  const [branchUuid, setBranchUuid] = useState("");
  const [warehouseUuid, setWarehouseUuid] = useState("");

  return (
    <div>
      <PageHeader title="Stock" description="View and adjust the quantities held for each Product in a Warehouse." />
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
        <StocksTable companyUuid={companyUuid} branchUuid={branchUuid} warehouseUuid={warehouseUuid} />
      )}
    </div>
  );
}

function StocksTable({
  companyUuid,
  branchUuid,
  warehouseUuid,
}: {
  companyUuid: string;
  branchUuid: string;
  warehouseUuid: string;
}) {
  const router = useRouter();
  const stocksQuery = useStocks(warehouseUuid);
  // Every row in this table shares the one active Warehouse (the list is
  // Warehouse-scoped, per `listStocksByWarehouse`'s own shape) — this lookup
  // exists only to render a friendly "code — name" label for the Warehouse
  // column below instead of a raw uuid, reusing the already-fetched
  // `WarehouseSelect` query (same `warehousesQueryKey`, so React Query
  // serves this from cache rather than firing a second request).
  const warehousesQuery = useWarehouses(branchUuid);
  const createStock = useCreateStock(warehouseUuid);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const stocks = stocksQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return stocks;
    }
    return stocks.filter((stock) => stock.productId.toLowerCase().includes(term));
  }, [stocksQuery.data, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const warehouseLabel = useMemo(() => {
    const warehouse = (warehousesQuery.data ?? []).find((candidate) => candidate.uuid === warehouseUuid);
    return warehouse ? `${warehouse.warehouseCode} — ${warehouse.name}` : warehouseUuid;
  }, [warehousesQuery.data, warehouseUuid]);

  const columns = useMemo(
    () => [
      // Flagged known backend gap (see stock.dto.ts's own header comment):
      // `StockResponseDto` carries a raw internal `productId`, not a
      // `productUuid` — there is no Product-name lookup available for this
      // column to resolve against, so the Product ID is shown as-is.
      columnHelper.accessor("productId", { header: "Product" }),
      columnHelper.display({
        id: "warehouse",
        header: "Warehouse",
        cell: () => warehouseLabel,
      }),
      columnHelper.accessor("quantityOnHand", { header: "Quantity On Hand" }),
      columnHelper.accessor("quantityReserved", { header: "Quantity Reserved" }),
      columnHelper.accessor("quantityAvailable", { header: "Quantity Available" }),
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
              router.push(`/inventory/stocks/${info.row.original.uuid}`);
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
            New Stock
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
        isLoading={stocksQuery.isLoading}
        isError={stocksQuery.isError}
        errorMessage={getInventoryErrorMessage(stocksQuery.error)}
        emptyIcon={<ListIcon className="h-6 w-6" />}
        emptyTitle={search ? "No Stock records match your search" : "No Stock yet"}
        emptyDescription={search ? "Try a different search term." : "Create the first Stock record for this Warehouse."}
        emptyAction={
          !search && (
            <LoadingButton isLoading={false} onClick={() => setIsCreateOpen(true)}>
              New Stock
            </LoadingButton>
          )
        }
        onRowClick={(stock) => router.push(`/inventory/stocks/${stock.uuid}`)}
        getRowKey={(stock) => stock.uuid}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />

      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Stock"
        description="Create a Stock record for a Product in this Warehouse."
      >
        <StockForm
          companyUuid={companyUuid}
          branchUuid={branchUuid}
          defaultValues={{
            companyUuid,
            branchUuid,
            warehouseUuid,
            productId: "",
            quantityOnHand: "",
            quantityReserved: "",
            quantityAvailable: "",
          }}
          submitLabel="Create Stock"
          isSubmitting={createStock.isPending}
          serverError={getInventoryErrorMessage(createStock.error)}
          fieldErrors={createStock.error?.details}
          onSubmit={(values) =>
            createStock.mutate(
              {
                companyUuid: values.companyUuid,
                warehouseUuid: values.warehouseUuid,
                productId: values.productId,
                quantityOnHand: values.quantityOnHand,
                quantityReserved: values.quantityReserved,
                quantityAvailable: values.quantityAvailable,
              },
              { onSuccess: () => setIsCreateOpen(false) },
            )
          }
        />
      </Drawer>
    </div>
  );
}
