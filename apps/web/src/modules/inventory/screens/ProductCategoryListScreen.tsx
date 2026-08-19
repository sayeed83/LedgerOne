"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import type { ProductCategoryResponseDto } from "@ledgerone/shared-types";
import { Drawer, ListIcon, LoadingButton, PlusIcon } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchBox } from "@/components/ui/SearchBox";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { useCurrentCompany } from "@/hooks/use-current-company";
import { useProductCategories } from "../hooks/use-product-categories";
import { useCreateProductCategory } from "../hooks/use-create-product-category";
import { ProductCategoryForm } from "../components/ProductCategoryForm";
import { CompanyContextBar } from "../components/CompanyContextBar";
import { getInventoryErrorMessage } from "../utils/inventory-error-messages";

const PAGE_SIZE = 10;
const columnHelper = createColumnHelper<ProductCategoryResponseDto>();

// Mirrors UnitListScreen.tsx's exact pattern (its own closest analog: a
// plain, unpaginated, Company-scoped reference-data list with
// create-via-Drawer).
export function ProductCategoryListScreen() {
  const { companyUuid } = useCurrentCompany();

  return (
    <div>
      <PageHeader
        title="Product Categories"
        description="Organize your Product catalog into a hierarchy for reporting and category-level defaults."
      />
      <CompanyContextBar />

      {companyUuid && <ProductCategoriesTable companyUuid={companyUuid} />}
    </div>
  );
}

function ProductCategoriesTable({ companyUuid }: { companyUuid: string }) {
  const router = useRouter();
  const productCategoriesQuery = useProductCategories(companyUuid);
  const createProductCategory = useCreateProductCategory(companyUuid);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const categories = productCategoriesQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return categories;
    }
    return categories.filter((category) => category.name.toLowerCase().includes(term));
  }, [productCategoriesQuery.data, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", { header: "Name" }),
      columnHelper.accessor("defaultTaxGroupUuid", {
        header: "Default Tax Group",
        cell: (info) => info.getValue() ?? "—",
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
            New Product Category
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
        isLoading={productCategoriesQuery.isLoading}
        isError={productCategoriesQuery.isError}
        errorMessage={getInventoryErrorMessage(productCategoriesQuery.error)}
        emptyIcon={<ListIcon className="h-6 w-6" />}
        emptyTitle={search ? "No Product Categories match your search" : "No Product Categories yet"}
        emptyDescription={
          search ? "Try a different search term." : "Create your first Product Category to get started."
        }
        emptyAction={
          !search && (
            <LoadingButton isLoading={false} onClick={() => setIsCreateOpen(true)}>
              New Product Category
            </LoadingButton>
          )
        }
        onRowClick={(category) => router.push(`/inventory/product-categories/${category.uuid}`)}
        getRowKey={(category) => category.uuid}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />

      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Product Category"
        description="Create a Product Category for this Company."
      >
        <ProductCategoryForm
          companyUuid={companyUuid}
          submitLabel="Create Product Category"
          isSubmitting={createProductCategory.isPending}
          serverError={getInventoryErrorMessage(createProductCategory.error)}
          fieldErrors={createProductCategory.error?.details}
          onSubmit={(values) =>
            createProductCategory.mutate(
              {
                companyUuid: values.companyUuid,
                name: values.name,
                parentProductCategoryUuid: values.parentProductCategoryUuid,
                defaultTaxGroupUuid: values.defaultTaxGroupUuid,
              },
              { onSuccess: () => setIsCreateOpen(false) },
            )
          }
        />
      </Drawer>
    </div>
  );
}
