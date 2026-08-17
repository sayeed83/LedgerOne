"use client";

import { useState } from "react";
import {
  Alert,
  BuildingIcon,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Drawer,
  EmptyState,
  LoadingButton,
  PencilIcon,
  Skeleton,
  TextInput,
} from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCurrentTenant } from "@/hooks/use-current-tenant";
import { useTenant } from "../hooks/use-tenant";
import { useCreateTenant } from "../hooks/use-create-tenant";
import { useUpdateTenant } from "../hooks/use-update-tenant";
import { useActivateTenant, useDeactivateTenant, useSuspendTenant } from "../hooks/use-tenant-lifecycle";
import { TenantForm } from "../components/TenantForm";
import { getOrganizationErrorMessage } from "../utils/organization-error-messages";
import type { ApiError } from "@/services/api-client";

// Single-Tenant view: this milestone's backend exposes `GET
// /tenants/:tenantUuid` only (no `GET /tenants` list), so "Tenant
// Management" is scoped to the one Tenant the operator has loaded/created
// — search/filter/pagination don't apply to a single record. Company/
// Branch/Department below get full list UIs since their own list endpoints
// exist.
function TenantLookupCard() {
  const { setTenantUuid } = useCurrentTenant();
  const [uuidInput, setUuidInput] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const createTenant = useCreateTenant();

  return (
    <>
      <EmptyState
        icon={<BuildingIcon className="h-6 w-6" />}
        title="No Tenant loaded"
        description="Enter an existing Tenant's UUID to manage it, or create a new Tenant to get started."
        action={
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
            <TextInput
              label="Tenant UUID"
              placeholder="00000000-0000-0000-0000-000000000000"
              value={uuidInput}
              onChange={(event) => setUuidInput(event.target.value)}
            />
            <div className="flex gap-2">
              <LoadingButton
                variant="secondary"
                isLoading={false}
                disabled={!uuidInput.trim()}
                onClick={() => setTenantUuid(uuidInput.trim())}
              >
                Load Tenant
              </LoadingButton>
              <LoadingButton isLoading={false} onClick={() => setIsCreateOpen(true)}>
                Create Tenant
              </LoadingButton>
            </div>
          </div>
        }
      />

      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Tenant"
        description="Register a new Tenant (Organization)."
      >
        <TenantForm
          submitLabel="Create Tenant"
          isSubmitting={createTenant.isPending}
          serverError={getOrganizationErrorMessage(createTenant.error)}
          fieldErrors={createTenant.error?.details}
          onSubmit={(values) =>
            createTenant.mutate(values, {
              onSuccess: (tenant) => {
                setTenantUuid(tenant.uuid);
                setIsCreateOpen(false);
              },
            })
          }
        />
      </Drawer>
    </>
  );
}

export function TenantScreen() {
  const { tenantUuid, setTenantUuid } = useCurrentTenant();
  const tenantQuery = useTenant(tenantUuid);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"suspend" | "deactivate" | null>(null);

  const updateTenant = useUpdateTenant(tenantUuid ?? "");
  const activateTenant = useActivateTenant(tenantUuid ?? "");
  const suspendTenant = useSuspendTenant(tenantUuid ?? "");
  const deactivateTenant = useDeactivateTenant(tenantUuid ?? "");

  if (!tenantUuid) {
    return (
      <div>
        <PageHeader title="Tenant Management" description="View and manage your Organization's Tenant record." />
        <Card>
          <CardContent className="pt-6">
            <TenantLookupCard />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Tenant Management"
        description="View and manage your Organization's Tenant record."
        actions={
          <LoadingButton variant="ghost" size="sm" isLoading={false} onClick={() => setTenantUuid(null)}>
            Switch Tenant
          </LoadingButton>
        }
      />

      {tenantQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
            <Skeleton variant="text" className="w-1/2" />
            <Skeleton variant="text" className="w-1/4" />
          </CardContent>
        </Card>
      )}

      {tenantQuery.isError && (
        <Alert
          variant="error"
          message={getOrganizationErrorMessage(tenantQuery.error as ApiError) ?? "Failed to load Tenant."}
        />
      )}

      {tenantQuery.data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <BuildingIcon className="h-5 w-5" />
              </span>
              <CardTitle>{tenantQuery.data.legalName}</CardTitle>
              <StatusBadge status={tenantQuery.data.status} />
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
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">Tenant UUID</dt>
                <dd className="mt-1 text-sm text-ink">{tenantQuery.data.uuid}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">Primary Contact Email</dt>
                <dd className="mt-1 text-sm text-ink">{tenantQuery.data.primaryContactEmail}</dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center gap-2 border-t border-surface-border pt-4">
              <LoadingButton
                variant="secondary"
                size="sm"
                isLoading={activateTenant.isPending}
                disabled={tenantQuery.data.status === "ACTIVE"}
                onClick={() => activateTenant.mutate()}
              >
                Activate
              </LoadingButton>
              <LoadingButton
                variant="secondary"
                size="sm"
                isLoading={false}
                disabled={tenantQuery.data.status !== "ACTIVE"}
                onClick={() => setConfirmAction("suspend")}
              >
                Suspend
              </LoadingButton>
              <LoadingButton
                variant="danger"
                size="sm"
                isLoading={false}
                disabled={tenantQuery.data.status === "DEACTIVATED"}
                onClick={() => setConfirmAction("deactivate")}
              >
                Deactivate
              </LoadingButton>
            </div>
          </CardContent>
        </Card>
      )}

      <Drawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Tenant"
        description="Update this Tenant's registered details."
      >
        {tenantQuery.data && (
          <TenantForm
            defaultValues={{
              legalName: tenantQuery.data.legalName,
              primaryContactEmail: tenantQuery.data.primaryContactEmail,
            }}
            isSubmitting={updateTenant.isPending}
            serverError={getOrganizationErrorMessage(updateTenant.error)}
            fieldErrors={updateTenant.error?.details}
            onSubmit={(values) => updateTenant.mutate(values, { onSuccess: () => setIsEditOpen(false) })}
          />
        )}
      </Drawer>

      {/* MOD-003/FORM-005: Suspend/Deactivate are irreversible-by-consequence
          lifecycle transitions and always go through a confirmation Dialog,
          never a single-click primary action. */}
      <ConfirmDialog
        isOpen={confirmAction === "suspend"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => suspendTenant.mutate(undefined, { onSuccess: () => setConfirmAction(null) })}
        title="Suspend this Tenant?"
        description="Suspending blocks the Tenant's ongoing operations until it is reactivated."
        confirmLabel="Suspend"
        isDestructive
        isConfirming={suspendTenant.isPending}
      />
      <ConfirmDialog
        isOpen={confirmAction === "deactivate"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => deactivateTenant.mutate(undefined, { onSuccess: () => setConfirmAction(null) })}
        title="Deactivate this Tenant?"
        description="Deactivation is terminal — this Tenant cannot be reactivated afterward."
        confirmLabel="Deactivate"
        isDestructive
        isConfirming={deactivateTenant.isPending}
      />
    </div>
  );
}
