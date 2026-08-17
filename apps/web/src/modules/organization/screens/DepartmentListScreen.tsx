"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import type { DepartmentResponseDto } from "@ledgerone/shared-types";
import { BuildingIcon, Drawer, EmptyState, LoadingButton, PlusIcon, UsersIcon } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchBox } from "@/components/ui/SearchBox";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { useCurrentTenant } from "@/hooks/use-current-tenant";
import { useDepartments } from "../hooks/use-departments";
import { useCreateDepartment } from "../hooks/use-create-department";
import { CompanyPicker } from "../components/CompanyPicker";
import { DepartmentForm } from "../components/DepartmentForm";
import { getOrganizationErrorMessage } from "../utils/organization-error-messages";

const PAGE_SIZE = 10;
const columnHelper = createColumnHelper<DepartmentResponseDto>();

export function DepartmentListScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenantUuid } = useCurrentTenant();

  const [companyUuid, setCompanyUuid] = useState(searchParams.get("companyUuid") ?? "");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const departmentsQuery = useDepartments(tenantUuid, companyUuid || null);
  const createDepartment = useCreateDepartment(tenantUuid ?? "", companyUuid);

  const filtered = useMemo(() => {
    const departments = departmentsQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return departments;
    }
    return departments.filter(
      (department) =>
        department.departmentName.toLowerCase().includes(term) ||
        department.departmentCode.toLowerCase().includes(term),
    );
  }, [departmentsQuery.data, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = useMemo(
    () => [
      columnHelper.accessor("departmentCode", { header: "Code" }),
      columnHelper.accessor("departmentName", { header: "Name" }),
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
        <PageHeader title="Department Management" description="Manage the Departments within a Company." />
        <EmptyState
          icon={<BuildingIcon className="h-6 w-6" />}
          title="No Tenant selected"
          description="Load or create a Tenant in Tenant Management before managing Departments."
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
      <PageHeader title="Department Management" description="Manage the Departments within a Company." />
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
            New Department
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
          icon={<UsersIcon className="h-6 w-6" />}
          title="Select a Company"
          description="Choose a Company above to view and manage its Departments."
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={paged}
            isLoading={departmentsQuery.isLoading}
            isError={departmentsQuery.isError}
            errorMessage={getOrganizationErrorMessage(departmentsQuery.error)}
            emptyIcon={<UsersIcon className="h-6 w-6" />}
            emptyTitle={search ? "No Departments match your search" : "No Departments yet"}
            emptyDescription={
              search ? "Try a different search term." : "Create the first Department for this Company."
            }
            emptyAction={
              !search && (
                <LoadingButton isLoading={false} onClick={() => setIsCreateOpen(true)}>
                  New Department
                </LoadingButton>
              )
            }
            onRowClick={(department) =>
              router.push(`/organization/departments/${department.uuid}?companyUuid=${companyUuid}`)
            }
            getRowKey={(department) => department.uuid}
          />
          <Pagination page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />
        </>
      )}

      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Department"
        description="Register a new Department under this Company."
      >
        <DepartmentForm
          submitLabel="Create Department"
          isSubmitting={createDepartment.isPending}
          serverError={getOrganizationErrorMessage(createDepartment.error)}
          fieldErrors={createDepartment.error?.details}
          onSubmit={(values) =>
            createDepartment.mutate(
              { ...values, companyUuid },
              { onSuccess: () => setIsCreateOpen(false) },
            )
          }
        />
      </Drawer>
    </div>
  );
}
