"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import type { BranchResponseDto } from "@ledgerone/shared-types";
import { BuildingIcon, Drawer, EmptyState, LayersIcon, LoadingButton, PlusIcon } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchBox } from "@/components/ui/SearchBox";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { useCurrentTenant } from "@/hooks/use-current-tenant";
import { useBranches } from "../hooks/use-branches";
import { useCreateBranch } from "../hooks/use-create-branch";
import { CompanyPicker } from "../components/CompanyPicker";
import { BranchForm } from "../components/BranchForm";
import { getOrganizationErrorMessage } from "../utils/organization-error-messages";

const PAGE_SIZE = 10;
const columnHelper = createColumnHelper<BranchResponseDto>();

export function BranchListScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenantUuid } = useCurrentTenant();

  const [companyUuid, setCompanyUuid] = useState(searchParams.get("companyUuid") ?? "");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const branchesQuery = useBranches(tenantUuid, companyUuid || null);
  const createBranch = useCreateBranch(tenantUuid ?? "", companyUuid);

  const filtered = useMemo(() => {
    const branches = branchesQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return branches;
    }
    return branches.filter(
      (branch) => branch.branchName.toLowerCase().includes(term) || branch.branchCode.toLowerCase().includes(term),
    );
  }, [branchesQuery.data, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = useMemo(
    () => [
      columnHelper.accessor("branchCode", { header: "Code" }),
      columnHelper.accessor("branchName", { header: "Name" }),
      columnHelper.accessor("city", { header: "City" }),
      columnHelper.accessor("countryCode", { header: "Country" }),
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
        <PageHeader title="Branch Management" description="Manage the Branches within a Company." />
        <EmptyState
          icon={<BuildingIcon className="h-6 w-6" />}
          title="No Tenant selected"
          description="Load or create a Tenant in Tenant Management before managing Branches."
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
      <PageHeader title="Branch Management" description="Manage the Branches within a Company." />
      <Toolbar
        filters={
          <div className="w-64">
            <CompanyPicker
              tenantUuid={tenantUuid}
              value={companyUuid}
              onChange={(next) => {
                setCompanyUuid(next);
                setPage(1);
              }}
            />
          </div>
        }
        actions={
          <LoadingButton
            isLoading={false}
            disabled={!companyUuid}
            leadingIcon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            New Branch
          </LoadingButton>
        }
      >
        {companyUuid && (
          <SearchBox
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search by name or code…"
          />
        )}
      </Toolbar>

      {!companyUuid ? (
        <EmptyState
          icon={<LayersIcon className="h-6 w-6" />}
          title="Select a Company"
          description="Choose a Company above to view and manage its Branches."
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={paged}
            isLoading={branchesQuery.isLoading}
            isError={branchesQuery.isError}
            errorMessage={getOrganizationErrorMessage(branchesQuery.error)}
            emptyIcon={<LayersIcon className="h-6 w-6" />}
            emptyTitle={search ? "No Branches match your search" : "No Branches yet"}
            emptyDescription={search ? "Try a different search term." : "Create the first Branch for this Company."}
            emptyAction={
              !search && (
                <LoadingButton isLoading={false} onClick={() => setIsCreateOpen(true)}>
                  New Branch
                </LoadingButton>
              )
            }
            onRowClick={(branch) => router.push(`/organization/branches/${branch.uuid}?companyUuid=${companyUuid}`)}
            getRowKey={(branch) => branch.uuid}
          />
          <Pagination page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />
        </>
      )}

      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Branch"
        description="Register a new Branch under this Company."
      >
        <BranchForm
          submitLabel="Create Branch"
          isSubmitting={createBranch.isPending}
          serverError={getOrganizationErrorMessage(createBranch.error)}
          fieldErrors={createBranch.error?.details}
          onSubmit={(values) =>
            createBranch.mutate(
              { ...values, companyUuid },
              { onSuccess: () => setIsCreateOpen(false) },
            )
          }
        />
      </Drawer>
    </div>
  );
}
