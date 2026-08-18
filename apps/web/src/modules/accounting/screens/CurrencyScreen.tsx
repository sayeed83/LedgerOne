"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import { CurrencyStatus, type CurrencyResponseDto } from "@ledgerone/shared-types";
import { CoinsIcon, Drawer, LoadingButton, PlusIcon, Select } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchBox } from "@/components/ui/SearchBox";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { useCreateCurrency, useCurrencies } from "../hooks/use-currencies";
import { CurrencyForm } from "../components/CurrencyForm";
import { getAccountingErrorMessage } from "../utils/accounting-error-messages";

const PAGE_SIZE = 10;
const columnHelper = createColumnHelper<CurrencyResponseDto>();

// Platform-owned reference data (MT-005) — no Company scoping needed,
// unlike Financial Year/Tax Group/Account Group/Chart of Accounts.
export function CurrencyScreen() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<CurrencyStatus | undefined>(undefined);
  const currenciesQuery = useCurrencies(statusFilter);
  const createCurrency = useCreateCurrency();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const currencies = currenciesQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return currencies;
    }
    return currencies.filter(
      (currency) => currency.isoCode.toLowerCase().includes(term) || currency.name.toLowerCase().includes(term),
    );
  }, [currenciesQuery.data, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = useMemo(
    () => [
      columnHelper.accessor("isoCode", { header: "ISO Code" }),
      columnHelper.accessor("name", { header: "Name" }),
      columnHelper.accessor("symbol", { header: "Symbol" }),
      columnHelper.accessor("decimalPrecision", { header: "Decimals" }),
      columnHelper.accessor("status", { header: "Status", cell: (info) => <StatusBadge status={info.getValue()} /> }),
    ],
    [],
  );

  return (
    <div>
      <PageHeader title="Currencies" description="Manage the platform's Currency reference data." />
      <Toolbar
        filters={
          <Select
            label="Status"
            compact
            value={statusFilter ?? ""}
            options={[
              { value: "", label: "All statuses" },
              { value: CurrencyStatus.Active, label: "Active" },
              { value: CurrencyStatus.Inactive, label: "Inactive" },
            ]}
            onChange={(next) => setStatusFilter((next || undefined) as CurrencyStatus | undefined)}
          />
        }
        actions={
          <LoadingButton
            isLoading={false}
            leadingIcon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            New Currency
          </LoadingButton>
        }
      >
        <SearchBox
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by code or name…"
        />
      </Toolbar>

      <DataTable
        columns={columns}
        data={paged}
        isLoading={currenciesQuery.isLoading}
        isError={currenciesQuery.isError}
        errorMessage={getAccountingErrorMessage(currenciesQuery.error)}
        emptyIcon={<CoinsIcon className="h-6 w-6" />}
        emptyTitle={search ? "No Currencies match your search" : "No Currencies yet"}
        emptyDescription={search ? "Try a different search term." : "Create your first Currency to get started."}
        emptyAction={
          !search && (
            <LoadingButton isLoading={false} onClick={() => setIsCreateOpen(true)}>
              New Currency
            </LoadingButton>
          )
        }
        onRowClick={(currency) => router.push(`/accounting/currencies/${currency.uuid}`)}
        getRowKey={(currency) => currency.uuid}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />

      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Currency"
        description="Register a new Currency."
      >
        <CurrencyForm
          submitLabel="Create Currency"
          isSubmitting={createCurrency.isPending}
          serverError={getAccountingErrorMessage(createCurrency.error)}
          fieldErrors={createCurrency.error?.details}
          onSubmit={(values) =>
            createCurrency.mutate(values, { onSuccess: () => setIsCreateOpen(false) })
          }
        />
      </Drawer>
    </div>
  );
}
