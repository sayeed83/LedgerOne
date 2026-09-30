"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import type { CustomerResponseDto } from "@ledgerone/shared-types";
import { Drawer, ListIcon, LoadingButton, PlusIcon } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchBox } from "@/components/ui/SearchBox";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCurrentCompany } from "@/hooks/use-current-company";
import { useCustomersByCompany } from "../hooks/use-customers";
import { useCreateCustomer } from "../hooks/use-create-customer";
import { CustomerForm } from "../components/CustomerForm";
import { CompanyContextBar } from "../components/CompanyContextBar";
import { getSalesErrorMessage } from "../utils/sales-error-messages";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

const PAGE_SIZE = 10;
const columnHelper = createColumnHelper<CustomerResponseDto>();

// Mirrors ProductListScreen.tsx's exact pattern (its own closest analog: a
// Company-scoped entity with create-via-Drawer, a status enum, and no
// further nested pickers).
export function CustomerListScreen() {
  const { companyUuid } = useCurrentCompany();

  return (
    <div>
      <PageHeader title="Customers" description="Manage the parties this Company sells to." />
      <CompanyContextBar />

      {companyUuid && <CustomersTable companyUuid={companyUuid} />}
    </div>
  );
}

function CustomersTable({ companyUuid }: { companyUuid: string }) {
  const router = useRouter();
  const customersQuery = useCustomersByCompany(companyUuid);
  const createCustomer = useCreateCustomer(companyUuid);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const customers = customersQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return customers;
    }
    return customers.filter((customer) => customer.name.toLowerCase().includes(term));
  }, [customersQuery.data, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", { header: "Name" }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor("creditLimit", { header: "Credit Limit" }),
      columnHelper.accessor("paymentTerms", {
        header: "Payment Terms",
        cell: (info) => info.getValue() ?? "—",
      }),
      columnHelper.accessor("city", {
        header: "City",
        cell: (info) => info.getValue() ?? "—",
      }),
      columnHelper.accessor("countryCode", {
        header: "Country",
        cell: (info) => info.getValue() ?? "—",
      }),
      columnHelper.accessor("createdAt", { header: "Created At", cell: (info) => formatDateTime(info.getValue()) }),
      columnHelper.accessor("updatedAt", { header: "Updated At", cell: (info) => formatDateTime(info.getValue()) }),
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
            New Customer
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
        isLoading={customersQuery.isLoading}
        isError={customersQuery.isError}
        errorMessage={getSalesErrorMessage(customersQuery.error)}
        emptyIcon={<ListIcon className="h-6 w-6" />}
        emptyTitle={search ? "No Customers match your search" : "No Customers yet"}
        emptyDescription={search ? "Try a different search term." : "Create your first Customer to get started."}
        emptyAction={
          !search && (
            <LoadingButton isLoading={false} onClick={() => setIsCreateOpen(true)}>
              New Customer
            </LoadingButton>
          )
        }
        onRowClick={(customer) => router.push(`/customers/${customer.uuid}`)}
        getRowKey={(customer) => customer.uuid}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />

      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Customer"
        description="Create a Customer for this Company."
      >
        <CustomerForm
          companyUuid={companyUuid}
          submitLabel="Create Customer"
          isSubmitting={createCustomer.isPending}
          serverError={getSalesErrorMessage(createCustomer.error)}
          fieldErrors={createCustomer.error?.details}
          onSubmit={(values) =>
            createCustomer.mutate(
              {
                companyUuid: values.companyUuid,
                name: values.name,
                addressLine1: values.addressLine1,
                addressLine2: values.addressLine2,
                city: values.city,
                region: values.region,
                postalCode: values.postalCode,
                countryCode: values.countryCode,
                creditLimit: values.creditLimit,
                paymentTerms: values.paymentTerms,
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
