"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, CalendarIcon, Card, CardContent, CardHeader, CardTitle, Drawer, LoadingButton, PencilIcon, Skeleton } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  useCloseFiscalPeriod,
  useFiscalPeriod,
  useReopenFiscalPeriod,
  useSoftCloseFiscalPeriod,
  useUpdateFiscalPeriod,
} from "../hooks/use-fiscal-periods";
import { FiscalPeriodForm } from "../components/FiscalPeriodForm";
import { getAccountingErrorMessage } from "../utils/accounting-error-messages";

export function FiscalPeriodDetailScreen() {
  const router = useRouter();
  const params = useParams<{ financialYearUuid: string; fiscalPeriodUuid: string }>();
  const { financialYearUuid, fiscalPeriodUuid } = params;

  const fiscalPeriodQuery = useFiscalPeriod(fiscalPeriodUuid);
  const updateFiscalPeriod = useUpdateFiscalPeriod(financialYearUuid, fiscalPeriodUuid);
  const softCloseFiscalPeriod = useSoftCloseFiscalPeriod(financialYearUuid, fiscalPeriodUuid);
  const closeFiscalPeriod = useCloseFiscalPeriod(financialYearUuid, fiscalPeriodUuid);
  const reopenFiscalPeriod = useReopenFiscalPeriod(financialYearUuid, fiscalPeriodUuid);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const status = fiscalPeriodQuery.data?.status;

  return (
    <div>
      <PageHeader
        title="Fiscal Period"
        description="Fiscal Period details and lifecycle."
        actions={
          <LoadingButton
            variant="ghost"
            size="sm"
            isLoading={false}
            onClick={() => router.push(`/accounting/financial-years/${financialYearUuid}`)}
          >
            Back to Financial Year
          </LoadingButton>
        }
      />

      {fiscalPeriodQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
            <Skeleton variant="text" className="w-1/2" />
          </CardContent>
        </Card>
      )}

      {fiscalPeriodQuery.isError && (
        <Alert variant="error" message={getAccountingErrorMessage(fiscalPeriodQuery.error) ?? "Failed to load Fiscal Period."} />
      )}

      {fiscalPeriodQuery.data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <CalendarIcon className="h-5 w-5" />
              </span>
              <CardTitle>
                {fiscalPeriodQuery.data.startDate} — {fiscalPeriodQuery.data.endDate}
              </CardTitle>
              <StatusBadge status={fiscalPeriodQuery.data.status} />
            </div>
            <LoadingButton
              variant="secondary"
              size="sm"
              isLoading={false}
              leadingIcon={<PencilIcon className="h-4 w-4" />}
              disabled={status === "CLOSED"}
              onClick={() => setIsEditOpen(true)}
            >
              Edit
            </LoadingButton>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            <div className="flex flex-wrap items-center gap-2 border-t border-surface-border light:border-light-surface-border pt-4">
              <LoadingButton
                variant="secondary"
                size="sm"
                isLoading={softCloseFiscalPeriod.isPending}
                disabled={status !== "OPEN"}
                onClick={() => softCloseFiscalPeriod.mutate()}
              >
                Soft Close
              </LoadingButton>
              <LoadingButton
                variant="secondary"
                size="sm"
                isLoading={closeFiscalPeriod.isPending}
                disabled={status !== "SOFT_CLOSED" && status !== "REOPENED"}
                onClick={() => closeFiscalPeriod.mutate()}
              >
                Close
              </LoadingButton>
              <LoadingButton
                variant="secondary"
                size="sm"
                isLoading={reopenFiscalPeriod.isPending}
                disabled={status !== "CLOSED"}
                onClick={() => reopenFiscalPeriod.mutate()}
              >
                Reopen
              </LoadingButton>
            </div>
          </CardContent>
        </Card>
      )}

      <Drawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Fiscal Period"
        description="Update this Fiscal Period's dates."
      >
        {fiscalPeriodQuery.data && (
          <FiscalPeriodForm
            financialYearUuid={financialYearUuid}
            defaultValues={{
              startDate: fiscalPeriodQuery.data.startDate.slice(0, 10),
              endDate: fiscalPeriodQuery.data.endDate.slice(0, 10),
            }}
            isSubmitting={updateFiscalPeriod.isPending}
            serverError={getAccountingErrorMessage(updateFiscalPeriod.error)}
            fieldErrors={updateFiscalPeriod.error?.details}
            onSubmit={(values) =>
              updateFiscalPeriod.mutate(
                { startDate: values.startDate, endDate: values.endDate },
                { onSuccess: () => setIsEditOpen(false) },
              )
            }
          />
        )}
      </Drawer>
    </div>
  );
}
