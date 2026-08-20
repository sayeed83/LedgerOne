"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import type { FiscalPeriodResponseDto } from "@ledgerone/shared-types";
import {
  Alert,
  CalendarIcon,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Drawer,
  LoadingButton,
  PlusIcon,
  Skeleton,
} from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable } from "@/components/data/DataTable";
import {
  useCloseFinancialYear,
  useFinancialYear,
  useOpenFinancialYear,
  useReopenFinancialYear,
  useUpdateFinancialYear,
} from "../hooks/use-financial-years";
import { useCreateFiscalPeriod, useFiscalPeriods } from "../hooks/use-fiscal-periods";
import { FinancialYearForm } from "../components/FinancialYearForm";
import { FiscalPeriodForm } from "../components/FiscalPeriodForm";
import { getAccountingErrorMessage } from "../utils/accounting-error-messages";

const columnHelper = createColumnHelper<FiscalPeriodResponseDto>();

export function FinancialYearDetailScreen() {
  const router = useRouter();
  const params = useParams<{ financialYearUuid: string }>();
  const financialYearUuid = params.financialYearUuid;

  const financialYearQuery = useFinancialYear(financialYearUuid);
  const companyUuid = financialYearQuery.data?.companyUuid ?? "";
  const updateFinancialYear = useUpdateFinancialYear(companyUuid, financialYearUuid);
  const openFinancialYear = useOpenFinancialYear(companyUuid, financialYearUuid);
  const closeFinancialYear = useCloseFinancialYear(companyUuid, financialYearUuid);
  const reopenFinancialYear = useReopenFinancialYear(companyUuid, financialYearUuid);

  const fiscalPeriodsQuery = useFiscalPeriods(financialYearUuid);
  const createFiscalPeriod = useCreateFiscalPeriod(financialYearUuid);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreatePeriodOpen, setIsCreatePeriodOpen] = useState(false);

  const status = financialYearQuery.data?.status;

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
      <PageHeader
        title="Financial Year"
        description="Financial Year details, lifecycle, and Fiscal Periods."
        actions={
          <LoadingButton
            variant="ghost"
            size="sm"
            isLoading={false}
            onClick={() => router.push("/accounting/financial-years")}
          >
            Back to Financial Years
          </LoadingButton>
        }
      />

      {financialYearQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
            <Skeleton variant="text" className="w-1/2" />
          </CardContent>
        </Card>
      )}

      {financialYearQuery.isError && (
        <Alert variant="error" message={getAccountingErrorMessage(financialYearQuery.error) ?? "Failed to load Financial Year."} />
      )}

      {financialYearQuery.data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <CalendarIcon className="h-5 w-5" />
              </span>
              <CardTitle>
                {financialYearQuery.data.startDate} — {financialYearQuery.data.endDate}
              </CardTitle>
              <StatusBadge status={financialYearQuery.data.status} />
            </div>
            <LoadingButton variant="secondary" size="sm" isLoading={false} onClick={() => setIsEditOpen(true)}>
              Edit
            </LoadingButton>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            <div className="flex flex-wrap items-center gap-2 border-t border-surface-border light:border-light-surface-border pt-4">
              <LoadingButton
                variant="secondary"
                size="sm"
                isLoading={openFinancialYear.isPending}
                disabled={status !== "FUTURE"}
                onClick={() => openFinancialYear.mutate()}
              >
                Open
              </LoadingButton>
              <LoadingButton
                variant="secondary"
                size="sm"
                isLoading={closeFinancialYear.isPending}
                disabled={status !== "OPEN" && status !== "CLOSING" && status !== "REOPENED"}
                onClick={() => closeFinancialYear.mutate()}
              >
                Close
              </LoadingButton>
              <LoadingButton
                variant="secondary"
                size="sm"
                isLoading={reopenFinancialYear.isPending}
                disabled={status !== "CLOSED"}
                onClick={() => reopenFinancialYear.mutate()}
              >
                Reopen
              </LoadingButton>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <PageHeader
          title="Fiscal Periods"
          description="Monthly subdivisions of this Financial Year."
          actions={
            <LoadingButton
              isLoading={false}
              leadingIcon={<PlusIcon className="h-4 w-4" />}
              onClick={() => setIsCreatePeriodOpen(true)}
            >
              New Fiscal Period
            </LoadingButton>
          }
        />
        <DataTable
          columns={columns}
          data={fiscalPeriodsQuery.data ?? []}
          isLoading={fiscalPeriodsQuery.isLoading}
          isError={fiscalPeriodsQuery.isError}
          errorMessage={getAccountingErrorMessage(fiscalPeriodsQuery.error)}
          emptyIcon={<CalendarIcon className="h-6 w-6" />}
          emptyTitle="No Fiscal Periods yet"
          emptyDescription="Create the first Fiscal Period for this Financial Year."
          emptyAction={
            <LoadingButton isLoading={false} onClick={() => setIsCreatePeriodOpen(true)}>
              New Fiscal Period
            </LoadingButton>
          }
          onRowClick={(period) =>
            router.push(`/accounting/financial-years/${financialYearUuid}/periods/${period.uuid}`)
          }
          getRowKey={(period) => period.uuid}
        />
      </div>

      <Drawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Financial Year"
        description="Update this Financial Year's dates."
      >
        {financialYearQuery.data && (
          <FinancialYearForm
            isEditing
            defaultValues={{
              companyUuid: financialYearQuery.data.companyUuid,
              startDate: financialYearQuery.data.startDate.slice(0, 10),
              endDate: financialYearQuery.data.endDate.slice(0, 10),
            }}
            isSubmitting={updateFinancialYear.isPending}
            serverError={getAccountingErrorMessage(updateFinancialYear.error)}
            fieldErrors={updateFinancialYear.error?.details}
            onSubmit={(values) =>
              updateFinancialYear.mutate(
                { startDate: values.startDate, endDate: values.endDate },
                { onSuccess: () => setIsEditOpen(false) },
              )
            }
          />
        )}
      </Drawer>

      <Drawer
        isOpen={isCreatePeriodOpen}
        onClose={() => setIsCreatePeriodOpen(false)}
        title="New Fiscal Period"
        description="Add a Fiscal Period to this Financial Year."
      >
        <FiscalPeriodForm
          financialYearUuid={financialYearUuid}
          submitLabel="Create Fiscal Period"
          isSubmitting={createFiscalPeriod.isPending}
          serverError={getAccountingErrorMessage(createFiscalPeriod.error)}
          fieldErrors={createFiscalPeriod.error?.details}
          onSubmit={(values) =>
            createFiscalPeriod.mutate(values, { onSuccess: () => setIsCreatePeriodOpen(false) })
          }
        />
      </Drawer>
    </div>
  );
}
