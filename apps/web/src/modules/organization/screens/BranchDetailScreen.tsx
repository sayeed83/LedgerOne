"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Drawer,
  LayersIcon,
  LoadingButton,
  PencilIcon,
  Skeleton,
} from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCurrentTenant } from "@/hooks/use-current-tenant";
import { useBranch } from "../hooks/use-branch";
import { useUpdateBranch } from "../hooks/use-update-branch";
import { BranchForm } from "../components/BranchForm";
import { getOrganizationErrorMessage } from "../utils/organization-error-messages";

export function BranchDetailScreen() {
  const router = useRouter();
  const params = useParams<{ branchUuid: string }>();
  const searchParams = useSearchParams();
  const companyUuid = searchParams.get("companyUuid") ?? undefined;
  const branchUuid = params.branchUuid;
  const { tenantUuid } = useCurrentTenant();
  const branchQuery = useBranch(tenantUuid, branchUuid);
  const updateBranch = useUpdateBranch(tenantUuid ?? "", branchUuid, companyUuid);

  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title={branchQuery.data?.branchName ?? "Branch"}
        description="Branch details and address."
        actions={
          <LoadingButton
            variant="ghost"
            size="sm"
            isLoading={false}
            onClick={() =>
              router.push(companyUuid ? `/organization/branches?companyUuid=${companyUuid}` : "/organization/branches")
            }
          >
            Back to Branches
          </LoadingButton>
        }
      />

      {branchQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
            <Skeleton variant="text" className="w-1/2" />
          </CardContent>
        </Card>
      )}

      {branchQuery.isError && (
        <Alert variant="error" message={getOrganizationErrorMessage(branchQuery.error) ?? "Failed to load Branch."} />
      )}

      {branchQuery.data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <LayersIcon className="h-5 w-5" />
              </span>
              <CardTitle>{branchQuery.data.branchName}</CardTitle>
              <StatusBadge status={branchQuery.data.status} />
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
          <CardContent className="pt-4">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Branch Code" value={branchQuery.data.branchCode} />
              <Field label="Address Line 1" value={branchQuery.data.addressLine1} />
              <Field label="Address Line 2" value={branchQuery.data.addressLine2 ?? "—"} />
              <Field label="City" value={branchQuery.data.city} />
              <Field label="Region" value={branchQuery.data.region ?? "—"} />
              <Field label="Postal Code" value={branchQuery.data.postalCode ?? "—"} />
              <Field label="Country Code" value={branchQuery.data.countryCode} />
              <Field label="Time Zone" value={branchQuery.data.timeZone} />
            </dl>
          </CardContent>
        </Card>
      )}

      <Drawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Branch"
        description="Update this Branch's details."
      >
        {branchQuery.data && (
          <BranchForm
            defaultValues={{
              branchCode: branchQuery.data.branchCode,
              branchName: branchQuery.data.branchName,
              addressLine1: branchQuery.data.addressLine1,
              addressLine2: branchQuery.data.addressLine2 ?? "",
              city: branchQuery.data.city,
              region: branchQuery.data.region ?? "",
              postalCode: branchQuery.data.postalCode ?? "",
              countryCode: branchQuery.data.countryCode,
              timeZone: branchQuery.data.timeZone,
            }}
            isSubmitting={updateBranch.isPending}
            serverError={getOrganizationErrorMessage(updateBranch.error)}
            fieldErrors={updateBranch.error?.details}
            onSubmit={(values) => updateBranch.mutate(values, { onSuccess: () => setIsEditOpen(false) })}
          />
        )}
      </Drawer>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted light:text-light-ink-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink light:text-light-ink">{value}</dd>
    </div>
  );
}
