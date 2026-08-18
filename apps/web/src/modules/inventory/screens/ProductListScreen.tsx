"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import type { ProductResponseDto } from "@ledgerone/shared-types";
import { Drawer, ListIcon, LoadingButton, PlusIcon } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchBox } from "@/components/ui/SearchBox";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCurrentCompany } from "@/hooks/use-current-company";
import { useProducts } from "../hooks/use-products";
import { useCreateProduct } from "../hooks/use-create-product";
import { ProductForm } from "../components/ProductForm";
import { CompanyContextBar } from "../components/CompanyContextBar";
import { getInventoryErrorMessage } from "../utils/inventory-error-messages";

const PAGE_SIZE = 10;
const columnHelper = createColumnHelper<ProductResponseDto>();

// Mirrors UnitListScreen.tsx's exact pattern (its own closest analog: a
// Company-scoped reference-data list with create-via-Drawer).
export function ProductListScreen() {
  const { companyUuid } = useCurrentCompany();

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage the items this Company buys, sells, manufactures, or stocks."
      />
      <CompanyContextBar />

      {companyUuid && <ProductsTable companyUuid={companyUuid} />}
    </div>
  );
}

function ProductsTable({ companyUuid }: { companyUuid: string }) {
  const router = useRouter();
  const productsQuery = useProducts(companyUuid);
  const createProduct = useCreateProduct(companyUuid);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const products = productsQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return products;
    }
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(term) || product.productCode.toLowerCase().includes(term),
    );
  }, [productsQuery.data, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = useMemo(
    () => [
      columnHelper.accessor("productCode", { header: "Code" }),
      columnHelper.accessor("name", { header: "Name" }),
      columnHelper.accessor("isStocked", {
        header: "Stocked",
        cell: (info) => (info.getValue() ? "Yes" : "No"),
      }),
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
            New Product
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
        isLoading={productsQuery.isLoading}
        isError={productsQuery.isError}
        errorMessage={getInventoryErrorMessage(productsQuery.error)}
        emptyIcon={<ListIcon className="h-6 w-6" />}
        emptyTitle={search ? "No Products match your search" : "No Products yet"}
        emptyDescription={search ? "Try a different search term." : "Create your first Product to get started."}
        emptyAction={
          !search && (
            <LoadingButton isLoading={false} onClick={() => setIsCreateOpen(true)}>
              New Product
            </LoadingButton>
          )
        }
        onRowClick={(product) => router.push(`/inventory/products/${product.uuid}`)}
        getRowKey={(product) => product.uuid}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />

      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Product"
        description="Create a Product for this Company."
      >
        <ProductForm
          companyUuid={companyUuid}
          submitLabel="Create Product"
          isSubmitting={createProduct.isPending}
          serverError={getInventoryErrorMessage(createProduct.error)}
          fieldErrors={createProduct.error?.details}
          onSubmit={(values) =>
            createProduct.mutate(
              {
                companyUuid: values.companyUuid,
                productCode: values.productCode,
                name: values.name,
                description: values.description,
                productCategoryUuid: values.productCategoryUuid,
                unitUuid: values.unitUuid,
                isStocked: values.isStocked,
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
