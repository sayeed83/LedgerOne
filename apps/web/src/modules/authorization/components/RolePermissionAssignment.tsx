"use client";

import { useMemo } from "react";
import { Alert, Badge, LoadingButton, Skeleton, TrashIcon } from "@ledgerone/ui";
import { usePermissions } from "../hooks/use-permissions";
import { useAssignPermission, useRemovePermission, useRolePermissions } from "../hooks/use-role-permissions";
import { getAuthorizationErrorMessage } from "../utils/authorization-error-messages";

export interface RolePermissionAssignmentProps {
  roleUuid: string;
}

// Mirrors User Management's own `UserRoleAssignment.tsx` chip pattern
// exactly (assigned vs. available, grant/revoke inline, no separate
// create-drawer) — the same UX for the sibling Role↔Permission grant
// relationship (00_BUSINESS_RULES.md Ch.11.3/Ch.12.10). Available
// Permissions are grouped by `moduleName` (PRM-001) since the platform-wide
// catalog can span every module, unlike a User's small Role list.
export function RolePermissionAssignment({ roleUuid }: RolePermissionAssignmentProps) {
  const permissionsQuery = usePermissions();
  const rolePermissionsQuery = useRolePermissions(roleUuid);
  const assignPermission = useAssignPermission(roleUuid);
  const removePermission = useRemovePermission(roleUuid);

  const assignedKeys = useMemo(
    () => new Set((rolePermissionsQuery.data ?? []).map((permission) => permission.permissionKey)),
    [rolePermissionsQuery.data],
  );

  const availableByModule = useMemo(() => {
    const available = (permissionsQuery.data ?? []).filter(
      (permission) => !assignedKeys.has(permission.permissionKey),
    );
    const grouped = new Map<string, typeof available>();
    for (const permission of available) {
      const bucket = grouped.get(permission.moduleName) ?? [];
      bucket.push(permission);
      grouped.set(permission.moduleName, bucket);
    }
    return grouped;
  }, [permissionsQuery.data, assignedKeys]);

  if (rolePermissionsQuery.isLoading || permissionsQuery.isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton variant="text" className="w-1/3" />
        <Skeleton variant="text" className="w-1/2" />
      </div>
    );
  }

  if (rolePermissionsQuery.isError) {
    return (
      <Alert
        variant="error"
        message={getAuthorizationErrorMessage(rolePermissionsQuery.error) ?? "Failed to load granted Permissions."}
      />
    );
  }

  if (permissionsQuery.isError) {
    return (
      <Alert
        variant="error"
        message={getAuthorizationErrorMessage(permissionsQuery.error) ?? "Failed to load the Permission catalog."}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">Granted Permissions</p>
        {(rolePermissionsQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-ink-muted">No Permissions granted yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {rolePermissionsQuery.data!.map((permission) => (
              <span
                key={permission.permissionKey}
                className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-sunken px-3 py-1 text-sm text-ink"
              >
                {permission.permissionKey}
                <Badge variant="default">{permission.action}</Badge>
                <button
                  type="button"
                  aria-label={`Revoke ${permission.permissionKey}`}
                  onClick={() => removePermission.mutate(permission.permissionKey)}
                  disabled={removePermission.isPending}
                  className="text-ink-faint hover:text-danger-500"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">Available Permissions</p>
        {(permissionsQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-ink-muted">
            No Permissions exist in the platform catalog yet — none have been seeded or registered.
          </p>
        ) : availableByModule.size === 0 ? (
          <p className="text-sm text-ink-muted">Every catalog Permission is already granted to this Role.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {Array.from(availableByModule.entries()).map(([moduleName, permissions]) => (
              <div key={moduleName}>
                <p className="mb-1 text-xs text-ink-faint">{moduleName}</p>
                <div className="flex flex-wrap gap-2">
                  {permissions.map((permission) => (
                    <LoadingButton
                      key={permission.permissionKey}
                      variant="secondary"
                      size="sm"
                      isLoading={assignPermission.isPending}
                      onClick={() => assignPermission.mutate(permission.permissionKey)}
                    >
                      + {permission.permissionKey}
                    </LoadingButton>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
