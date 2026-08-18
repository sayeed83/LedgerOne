"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import type { UnitResponseDto } from "@ledgerone/shared-types";
import { Drawer, ListIcon, LoadingButton, PlusIcon } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchBox } from "@/components/ui/SearchBox";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { useCurrentCompany } from "@/hooks/use-current-company";
import { useUnits } from "../hooks/use-units";
import { useCreateUnit } from "../hooks/use-create-unit";
import { UnitForm } from "../components/UnitForm";
import { CompanyContextBar } from "../components/CompanyContextBar";
import { getInventoryErrorMessage } from "../utils/inventory-error-messages";

const PAGE_SIZE = 10;
const columnHelper = createColumnHelper<UnitResponseDto>();

// Mirrors Accounting's own ChartOfAccountsScreen.tsx pattern exactly (its
// Account Groups tab, specifically — the closest existing analog: a plain,
// unpaginated, Company-scoped reference-data list with create-via-Drawer).
export function UnitListScreen() {
  const { companyUuid } = useCurrentCompany();

  return (
    <div>
      <PageHeader
        title="Units of Measure"
        description="Manage the quantity-measurement conventions Products are stocked and transacted in."
      />
      <CompanyContextBar />

      {companyUuid && <UnitsTable companyUuid={companyUuid} />}
    </div>
  );
}

function UnitsTable({ companyUuid }: { companyUuid: string }) {
  const router = useRouter();
  const unitsQuery = useUnits(companyUuid);
  const createUnit = useCreateUnit(companyUuid);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const units = unitsQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return units;
    }
    return units.filter(
      (unit) => unit.name.toLowerCase().includes(term) || unit.symbol.toLowerCase().includes(term),
    );
  }, [unitsQuery.data, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", { header: "Name" }),
      columnHelper.accessor("symbol", { header: "Symbol" }),
      columnHelper.accessor("conversionFactor", {
        header: "Conversion Factor",
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
            New Unit
          </LoadingButton>
        }
      >
        <SearchBox
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by name or symbol…"
        />
      </Toolbar>

      <DataTable
        columns={columns}
        data={paged}
        isLoading={unitsQuery.isLoading}
        isError={unitsQuery.isError}
        errorMessage={getInventoryErrorMessage(unitsQuery.error)}
        emptyIcon={<ListIcon className="h-6 w-6" />}
        emptyTitle={search ? "No Units match your search" : "No Units yet"}
        emptyDescription={search ? "Try a different search term." : "Create your first Unit of Measure to get started."}
        emptyAction={
          !search && (
            <LoadingButton isLoading={false} onClick={() => setIsCreateOpen(true)}>
              New Unit
            </LoadingButton>
          )
        }
        onRowClick={(unit) => router.push(`/inventory/units/${unit.uuid}`)}
        getRowKey={(unit) => unit.uuid}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />

      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Unit"
        description="Create a Unit of Measure for this Company."
      >
        <UnitForm
          companyUuid={companyUuid}
          submitLabel="Create Unit"
          isSubmitting={createUnit.isPending}
          serverError={getInventoryErrorMessage(createUnit.error)}
          fieldErrors={createUnit.error?.details}
          onSubmit={(values) =>
            createUnit.mutate(
              {
                companyUuid: values.companyUuid,
                name: values.name,
                symbol: values.symbol,
                baseUnitUuid: values.baseUnitUuid,
                conversionFactor: values.conversionFactor,
              },
              { onSuccess: () => setIsCreateOpen(false) },
            )
          }
        />
      </Drawer>
    </div>
  );
}
