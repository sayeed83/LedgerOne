"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  BuildingIcon,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Drawer,
  LoadingButton,
  PencilIcon,
  Skeleton,
} from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCurrentTenant } from "@/hooks/use-current-tenant";
import { useCompany } from "../hooks/use-company";
import { useUpdateCompany } from "../hooks/use-update-company";
import { useActivateCompany, useCloseCompany } from "../hooks/use-company-lifecycle";
import { CompanyForm } from "../components/CompanyForm";
import { getOrganizationErrorMessage } from "../utils/organization-error-messages";

export function CompanyDetailScreen() {
  const router = useRouter();
  const params = useParams<{ companyUuid: string }>();
  const companyUuid = params.companyUuid;
  const { tenantUuid } = useCurrentTenant();
  const companyQuery = useCompany(tenantUuid, companyUuid);
  const updateCompany = useUpdateCompany(tenantUuid ?? "", companyUuid);
  const activateCompany = useActivateCompany(tenantUuid ?? "", companyUuid);
  const closeCompany = useCloseCompany(tenantUuid ?? "", companyUuid);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title={companyQuery.data?.legalName ?? "Company"}
        description="Company details, lifecycle, and configuration."
        actions={
          <LoadingButton variant="ghost" size="sm" isLoading={false} onClick={() => router.push("/organization/companies")}>
            Back to Companies
          </LoadingButton>
        }
      />

      {companyQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
            <Skeleton variant="text" className="w-1/2" />
            <Skeleton variant="text" className="w-1/4" />
          </CardContent>
        </Card>
      )}

      {companyQuery.isError && (
        <Alert variant="error" message={getOrganizationErrorMessage(companyQuery.error) ?? "Failed to load Company."} />
      )}

      {companyQuery.data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <BuildingIcon className="h-5 w-5" />
              </span>
              <CardTitle>{companyQuery.data.legalName}</CardTitle>
              <StatusBadge status={companyQuery.data.status} />
            </div>
            <LoadingButton
              variant="secondary"
              size="sm"
              isLoading={false}
              leadingIcon={<PencilIcon className="h-4 w-4" />}
              onClick={() => setIsEditOpen(true)}
            >
              Edit
            </LoadingButton>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Company Code" value={companyQuery.data.companyCode} />
              <Field label="Display Name" value={companyQuery.data.displayName ?? "—"} />
              <Field label="Legal Entity Type" value={companyQuery.data.legalEntityType ?? "—"} />
              <Field label="Tax Registration Number" value={companyQuery.data.taxRegistrationNumber} />
              <Field label="Base Currency" value={companyQuery.data.baseCurrencyCode} />
              <Field label="Country" value={companyQuery.data.country} />
              <Field label="Time Zone" value={companyQuery.data.timeZone} />
              <Field
                label="Financial Year Start"
                value={`${companyQuery.data.financialYearStartMonth}/${companyQuery.data.financialYearStartDay}`}
              />
            </dl>

            <div className="flex flex-wrap items-center gap-2 border-t border-surface-border pt-4">
              <LoadingButton
                variant="secondary"
                size="sm"
                isLoading={activateCompany.isPending}
                disabled={companyQuery.data.status === "ACTIVE"}
                onClick={() => activateCompany.mutate()}
              >
                Activate
              </LoadingButton>
              <LoadingButton
                variant="danger"
                size="sm"
                isLoading={false}
                disabled={companyQuery.data.status !== "ACTIVE"}
                onClick={() => setIsCloseConfirmOpen(true)}
              >
                Close
              </LoadingButton>
              <div className="ml-auto flex items-center gap-2">
                <LoadingButton
                  variant="ghost"
                  size="sm"
                  isLoading={false}
                  onClick={() => router.push(`/organization/branches?companyUuid=${companyUuid}`)}
                >
                  View Branches
                </LoadingButton>
                <LoadingButton
                  variant="ghost"
                  size="sm"
                  isLoading={false}
                  onClick={() => router.push(`/organization/departments?companyUuid=${companyUuid}`)}
                >
                  View Departments
                </LoadingButton>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Drawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Company"
        description="Update this Company's registered details."
      >
        {companyQuery.data && (
          <CompanyForm
            defaultValues={{
              companyCode: companyQuery.data.companyCode,
              legalName: companyQuery.data.legalName,
              displayName: companyQuery.data.displayName ?? "",
              legalEntityType: companyQuery.data.legalEntityType ?? "",
              taxRegistrationNumber: companyQuery.data.taxRegistrationNumber,
              baseCurrencyCode: companyQuery.data.baseCurrencyCode,
              country: companyQuery.data.country,
              timeZone: companyQuery.data.timeZone,
              financialYearStartMonth: companyQuery.data.financialYearStartMonth,
              financialYearStartDay: companyQuery.data.financialYearStartDay,
            }}
            isSubmitting={updateCompany.isPending}
            serverError={getOrganizationErrorMessage(updateCompany.error)}
            fieldErrors={updateCompany.error?.details}
            onSubmit={(values) =>
              updateCompany.mutate(
                { ...values, displayName: values.displayName || null, legalEntityType: values.legalEntityType || null },
                { onSuccess: () => setIsEditOpen(false) },
              )
            }
          />
        )}
      </Drawer>

      <ConfirmDialog
        isOpen={isCloseConfirmOpen}
        onClose={() => setIsCloseConfirmOpen(false)}
        onConfirm={() => closeCompany.mutate(undefined, { onSuccess: () => setIsCloseConfirmOpen(false) })}
        title="Close this Company?"
        description="Closing stops further activity under this Company until it is reactivated."
        confirmLabel="Close Company"
        isDestructive
        isConfirming={closeCompany.isPending}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value}</dd>
    </div>
  );
}
