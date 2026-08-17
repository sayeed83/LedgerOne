"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import type { CompanyResponseDto } from "@ledgerone/shared-types";
import { BuildingIcon, Drawer, EmptyState, LoadingButton, PlusIcon } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchBox } from "@/components/ui/SearchBox";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { useCurrentTenant } from "@/hooks/use-current-tenant";
import { useCompanies } from "../hooks/use-companies";
import { useCreateCompany } from "../hooks/use-create-company";
import { CompanyForm } from "../components/CompanyForm";
import { getOrganizationErrorMessage } from "../utils/organization-error-messages";

const PAGE_SIZE = 10;
const columnHelper = createColumnHelper<CompanyResponseDto>();

export function CompanyListScreen() {
  const router = useRouter();
  const { tenantUuid } = useCurrentTenant();
  const companiesQuery = useCompanies(tenantUuid);
  const createCompany = useCreateCompany(tenantUuid ?? "");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const companies = companiesQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return companies;
    }
    return companies.filter(
      (company) =>
        company.legalName.toLowerCase().includes(term) || company.companyCode.toLowerCase().includes(term),
    );
  }, [companiesQuery.data, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = useMemo(
    () => [
      columnHelper.accessor("companyCode", { header: "Code" }),
      columnHelper.accessor("legalName", { header: "Legal Name" }),
      columnHelper.accessor("country", { header: "Country" }),
      columnHelper.accessor("baseCurrencyCode", { header: "Currency" }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
    ],
    [],
  );

  if (!tenantUuid) {
    return (
      <div>
        <PageHeader title="Company Management" description="Manage the Companies within your Tenant." />
        <EmptyState
          icon={<BuildingIcon className="h-6 w-6" />}
          title="No Tenant selected"
          description="Load or create a Tenant in Tenant Management before managing its Companies."
          action={
            <LoadingButton isLoading={false} onClick={() => router.push("/organization/tenant")}>
              Go to Tenant Management
            </LoadingButton>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Company Management" description="Manage the Companies within your Tenant." />
      <Toolbar
        actions={
          <LoadingButton
            isLoading={false}
            leadingIcon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            New Company
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
        isLoading={companiesQuery.isLoading}
        isError={companiesQuery.isError}
        errorMessage={getOrganizationErrorMessage(companiesQuery.error)}
        emptyIcon={<BuildingIcon className="h-6 w-6" />}
        emptyTitle={search ? "No Companies match your search" : "No Companies yet"}
        emptyDescription={
          search ? "Try a different search term." : "Create your first Company to get started."
        }
        emptyAction={
          !search && (
            <LoadingButton isLoading={false} onClick={() => setIsCreateOpen(true)}>
              New Company
            </LoadingButton>
          )
        }
        onRowClick={(company) => router.push(`/organization/companies/${company.uuid}`)}
        getRowKey={(company) => company.uuid}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />

      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Company"
        description="Register a new Company under this Tenant."
      >
        <CompanyForm
          submitLabel="Create Company"
          isSubmitting={createCompany.isPending}
          serverError={getOrganizationErrorMessage(createCompany.error)}
          fieldErrors={createCompany.error?.details}
          onSubmit={(values) =>
            createCompany.mutate(
              { ...values, displayName: values.displayName || null, legalEntityType: values.legalEntityType || null },
              { onSuccess: () => setIsCreateOpen(false) },
            )
          }
        />
      </Drawer>
    </div>
  );
}
