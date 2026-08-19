"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Drawer,
  KeyIcon,
  LoadingButton,
  PencilIcon,
  Skeleton,
} from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useRole, useRetireRole, useUpdateRole } from "../hooks/use-role";
import { RoleForm } from "../components/RoleForm";
import { RolePermissionAssignment } from "../components/RolePermissionAssignment";
import { getAuthorizationErrorMessage } from "../utils/authorization-error-messages";

// Mirrors UnitDetailScreen.tsx's/TenantScreen.tsx's own pattern — a record
// view with an Edit Drawer, plus a "Retire" one-way lifecycle transition
// (Ch.11.5) behind a ConfirmDialog (mirrors TenantScreen.tsx's own
// Suspend/Deactivate confirmation pattern, MOD-003/FORM-005), plus the
// Role↔Permission grant management this Role owns (Ch.11.3/Ch.12.10).
export function RoleDetailScreen() {
  const router = useRouter();
  const params = useParams<{ roleUuid: string }>();
  const roleUuid = params.roleUuid;

  const roleQuery = useRole(roleUuid);
  const updateRole = useUpdateRole(roleUuid);
  const retireRole = useRetireRole(roleUuid);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConfirmingRetire, setIsConfirmingRetire] = useState(false);

  return (
    <div>
      <PageHeader
        title="Role"
        description="Role details and Permission grants."
        actions={
          <LoadingButton variant="ghost" size="sm" isLoading={false} onClick={() => router.push("/authorization/roles")}>
            Back to Roles
          </LoadingButton>
        }
      />

      {roleQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
          </CardContent>
        </Card>
      )}

      {roleQuery.isError && (
        <Alert variant="error" message={getAuthorizationErrorMessage(roleQuery.error) ?? "Failed to load Role."} />
      )}

      {roleQuery.data && (
        <Card className="mb-6">
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <KeyIcon className="h-5 w-5" />
              </span>
              <CardTitle>{roleQuery.data.name}</CardTitle>
              {roleQuery.data.isSystemRole && <Badge variant="default">System</Badge>}
              <StatusBadge status={roleQuery.data.status} />
            </div>
            <div className="flex items-center gap-2">
              <LoadingButton
                variant="secondary"
                size="sm"
                isLoading={false}
                leadingIcon={<PencilIcon className="h-4 w-4" />}
                onClick={() => setIsEditOpen(true)}
              >
                Edit
              </LoadingButton>
              <LoadingButton
                variant="danger"
                size="sm"
                isLoading={false}
                disabled={roleQuery.data.status === "RETIRED"}
                onClick={() => setIsConfirmingRetire(true)}
              >
                Retire
              </LoadingButton>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">Description</dt>
                <dd className="mt-1 text-sm text-ink">{roleQuery.data.description ?? "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {roleQuery.data && (
        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <RolePermissionAssignment roleUuid={roleUuid} />
          </CardContent>
        </Card>
      )}

      <Drawer isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Role" description="Update this Role.">
        {roleQuery.data && (
          <RoleForm
            defaultValues={{ name: roleQuery.data.name, description: roleQuery.data.description ?? "" }}
            isSubmitting={updateRole.isPending}
            serverError={getAuthorizationErrorMessage(updateRole.error)}
            fieldErrors={updateRole.error?.details}
            onSubmit={(values) => updateRole.mutate(values, { onSuccess: () => setIsEditOpen(false) })}
          />
        )}
      </Drawer>

      {/* MOD-003/FORM-005: Retire is a one-way, irreversible lifecycle
          transition (Ch.11.5) and always goes through a confirmation
          Dialog, never a single-click primary action. */}
      <ConfirmDialog
        isOpen={isConfirmingRetire}
        onClose={() => setIsConfirmingRetire(false)}
        onConfirm={() => retireRole.mutate(undefined, { onSuccess: () => setIsConfirmingRetire(false) })}
        title="Retire this Role?"
        description="Retiring is one-way — a Retired Role cannot be assigned to a new User, though existing assignments persist."
        confirmLabel="Retire"
        isDestructive
        isConfirming={retireRole.isPending}
      />
    </div>
  );
}
