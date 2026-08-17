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
  LoadingButton,
  PencilIcon,
  Skeleton,
  UsersIcon,
} from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCurrentTenant } from "@/hooks/use-current-tenant";
import { useDepartment } from "../hooks/use-department";
import { useUpdateDepartment } from "../hooks/use-update-department";
import { DepartmentForm } from "../components/DepartmentForm";
import { getOrganizationErrorMessage } from "../utils/organization-error-messages";

export function DepartmentDetailScreen() {
  const router = useRouter();
  const params = useParams<{ departmentUuid: string }>();
  const searchParams = useSearchParams();
  const companyUuid = searchParams.get("companyUuid") ?? undefined;
  const departmentUuid = params.departmentUuid;
  const { tenantUuid } = useCurrentTenant();
  const departmentQuery = useDepartment(tenantUuid, departmentUuid);
  const updateDepartment = useUpdateDepartment(tenantUuid ?? "", departmentUuid, companyUuid);

  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title={departmentQuery.data?.departmentName ?? "Department"}
        description="Department details."
        actions={
          <LoadingButton
            variant="ghost"
            size="sm"
            isLoading={false}
            onClick={() =>
              router.push(
                companyUuid ? `/organization/departments?companyUuid=${companyUuid}` : "/organization/departments",
              )
            }
          >
            Back to Departments
          </LoadingButton>
        }
      />

      {departmentQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
            <Skeleton variant="text" className="w-1/2" />
          </CardContent>
        </Card>
      )}

      {departmentQuery.isError && (
        <Alert
          variant="error"
          message={getOrganizationErrorMessage(departmentQuery.error) ?? "Failed to load Department."}
        />
      )}

      {departmentQuery.data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <UsersIcon className="h-5 w-5" />
              </span>
              <CardTitle>{departmentQuery.data.departmentName}</CardTitle>
              <StatusBadge status={departmentQuery.data.status} />
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
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">Department Code</dt>
                <dd className="mt-1 text-sm text-ink">{departmentQuery.data.departmentCode}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      <Drawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Department"
        description="Update this Department's details."
      >
        {departmentQuery.data && (
          <DepartmentForm
            defaultValues={{
              departmentCode: departmentQuery.data.departmentCode,
              departmentName: departmentQuery.data.departmentName,
            }}
            isSubmitting={updateDepartment.isPending}
            serverError={getOrganizationErrorMessage(updateDepartment.error)}
            fieldErrors={updateDepartment.error?.details}
            onSubmit={(values) => updateDepartment.mutate(values, { onSuccess: () => setIsEditOpen(false) })}
          />
        )}
      </Drawer>
    </div>
  );
}
