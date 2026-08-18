"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import type { FinancialYearResponseDto } from "@ledgerone/shared-types";
import { CalendarIcon, Drawer, LoadingButton, PlusIcon } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchBox } from "@/components/ui/SearchBox";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { useCurrentCompany } from "@/hooks/use-current-company";
import { useCreateFinancialYear, useFinancialYears } from "../hooks/use-financial-years";
import { FinancialYearForm } from "../components/FinancialYearForm";
import { CompanyContextBar } from "../components/CompanyContextBar";
import { getAccountingErrorMessage } from "../utils/accounting-error-messages";

const PAGE_SIZE = 10;
const columnHelper = createColumnHelper<FinancialYearResponseDto>();

export function FinancialYearScreen() {
  const router = useRouter();
  const { companyUuid } = useCurrentCompany();
  const financialYearsQuery = useFinancialYears(companyUuid);
  const createFinancialYear = useCreateFinancialYear(companyUuid ?? "");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const years = financialYearsQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return years;
    }
    return years.filter(
      (year) => year.startDate.includes(term) || year.endDate.includes(term) || year.status.toLowerCase().includes(term),
    );
  }, [financialYearsQuery.data, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = useMemo(
    () => [
      columnHelper.accessor("startDate", { header: "Start Date" }),
      columnHelper.accessor("endDate", { header: "End Date" }),
      columnHelper.accessor("status", { header: "Status", cell: (info) => <StatusBadge status={info.getValue()} /> }),
    ],
    [],
  );

  return (
    <div>
      <PageHeader title="Financial Years" description="Define and manage Financial Years and their lifecycle." />
      <CompanyContextBar />

      {companyUuid && (
        <>
          <Toolbar
            actions={
              <LoadingButton
                isLoading={false}
                leadingIcon={<PlusIcon className="h-4 w-4" />}
                onClick={() => setIsCreateOpen(true)}
              >
                New Financial Year
              </LoadingButton>
            }
          >
            <SearchBox
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search by date or status…"
            />
          </Toolbar>

          <DataTable
            columns={columns}
            data={paged}
            isLoading={financialYearsQuery.isLoading}
            isError={financialYearsQuery.isError}
            errorMessage={getAccountingErrorMessage(financialYearsQuery.error)}
            emptyIcon={<CalendarIcon className="h-6 w-6" />}
            emptyTitle={search ? "No Financial Years match your search" : "No Financial Years yet"}
            emptyDescription={
              search ? "Try a different search term." : "Create your first Financial Year to get started."
            }
            emptyAction={
              !search && (
                <LoadingButton isLoading={false} onClick={() => setIsCreateOpen(true)}>
                  New Financial Year
                </LoadingButton>
              )
            }
            onRowClick={(year) => router.push(`/accounting/financial-years/${year.uuid}`)}
            getRowKey={(year) => year.uuid}
          />
          <Pagination page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />

          <Drawer
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            title="New Financial Year"
            description="Define a new Financial Year for this Company."
          >
            <FinancialYearForm
              defaultValues={{ companyUuid, startDate: "", endDate: "" }}
              submitLabel="Create Financial Year"
              isSubmitting={createFinancialYear.isPending}
              serverError={getAccountingErrorMessage(createFinancialYear.error)}
              fieldErrors={createFinancialYear.error?.details}
              onSubmit={(values) => createFinancialYear.mutate(values, { onSuccess: () => setIsCreateOpen(false) })}
            />
          </Drawer>
        </>
      )}
    </div>
  );
}
