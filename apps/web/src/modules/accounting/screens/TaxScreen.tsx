"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import type { TaxGroupResponseDto } from "@ledgerone/shared-types";
import { Drawer, LoadingButton, PercentIcon, PlusIcon } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchBox } from "@/components/ui/SearchBox";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { useCurrentCompany } from "@/hooks/use-current-company";
import { useCreateTaxGroup, useTaxGroups } from "../hooks/use-tax-groups";
import { TaxGroupForm } from "../components/TaxGroupForm";
import { CompanyContextBar } from "../components/CompanyContextBar";
import { getAccountingErrorMessage } from "../utils/accounting-error-messages";

const PAGE_SIZE = 10;
const columnHelper = createColumnHelper<TaxGroupResponseDto>();

export function TaxScreen() {
  const router = useRouter();
  const { companyUuid } = useCurrentCompany();
  const taxGroupsQuery = useTaxGroups(companyUuid);
  const createTaxGroup = useCreateTaxGroup(companyUuid ?? "");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const groups = taxGroupsQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return groups;
    }
    return groups.filter((group) => group.name.toLowerCase().includes(term));
  }, [taxGroupsQuery.data, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = useMemo(() => [columnHelper.accessor("name", { header: "Name" })], []);

  return (
    <div>
      <PageHeader title="Tax Groups" description="Manage Tax Groups and their Tax Rules." />
      <CompanyContextBar />

      {companyUuid && (
        <>
          <Toolbar
            actions={
              <LoadingButton isLoading={false} leadingIcon={<PlusIcon className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
                New Tax Group
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
            isLoading={taxGroupsQuery.isLoading}
            isError={taxGroupsQuery.isError}
            errorMessage={getAccountingErrorMessage(taxGroupsQuery.error)}
            emptyIcon={<PercentIcon className="h-6 w-6" />}
            emptyTitle={search ? "No Tax Groups match your search" : "No Tax Groups yet"}
            emptyDescription={search ? "Try a different search term." : "Create your first Tax Group to get started."}
            emptyAction={
              !search && (
                <LoadingButton isLoading={false} onClick={() => setIsCreateOpen(true)}>
                  New Tax Group
                </LoadingButton>
              )
            }
            onRowClick={(group) => router.push(`/accounting/tax/${group.uuid}`)}
            getRowKey={(group) => group.uuid}
          />
          <Pagination page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />

          <Drawer isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Tax Group" description="Create a Tax Group for this Company.">
            <TaxGroupForm
              defaultValues={{ companyUuid, name: "" }}
              submitLabel="Create Tax Group"
              isSubmitting={createTaxGroup.isPending}
              serverError={getAccountingErrorMessage(createTaxGroup.error)}
              fieldErrors={createTaxGroup.error?.details}
              onSubmit={(values) => createTaxGroup.mutate(values, { onSuccess: () => setIsCreateOpen(false) })}
            />
          </Drawer>
        </>
      )}
    </div>
  );
}
