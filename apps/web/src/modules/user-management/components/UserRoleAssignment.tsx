"use client";

import { Alert, Badge, LoadingButton, Skeleton, TrashIcon } from "@ledgerone/ui";
import { useRoles } from "../hooks/use-roles";
import { useAssignRole, useRemoveRole, useUserRoles } from "../hooks/use-user-roles";

export interface UserRoleAssignmentProps {
  userUuid: string;
}

// Assign Roles: User↔Role assignment lives entirely in the Authorization
// module's own API (`POST/DELETE /authorization/users/:userUuid/roles`,
// 00_BUSINESS_RULES.md Ch.11.10) — this component is User Management's
// consumer of that existing contract, not a reimplementation of it.
export function UserRoleAssignment({ userUuid }: UserRoleAssignmentProps) {
  const rolesQuery = useRoles();
  const userRolesQuery = useUserRoles(userUuid);
  const assignRole = useAssignRole(userUuid);
  const removeRole = useRemoveRole(userUuid);

  if (userRolesQuery.isLoading || rolesQuery.isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton variant="text" className="w-1/3" />
        <Skeleton variant="text" className="w-1/2" />
      </div>
    );
  }

  if (userRolesQuery.isError || rolesQuery.isError) {
    return <Alert variant="error" message="Failed to load Roles." />;
  }

  const assignedRoleUuids = new Set((userRolesQuery.data ?? []).map((role) => role.uuid));
  const availableRoles = (rolesQuery.data ?? []).filter((role) => !assignedRoleUuids.has(role.uuid));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">Assigned Roles</p>
        {(userRolesQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-ink-muted">No Roles assigned yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {userRolesQuery.data!.map((role) => (
              <span
                key={role.uuid}
                className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-sunken px-3 py-1 text-sm text-ink"
              >
                {role.name}
                {role.isSystemRole && <Badge variant="default">System</Badge>}
                <button
                  type="button"
                  aria-label={`Remove ${role.name} role`}
                  onClick={() => removeRole.mutate(role.uuid)}
                  disabled={removeRole.isPending}
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
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">Available Roles</p>
        {availableRoles.length === 0 ? (
          <p className="text-sm text-ink-muted">No further Roles to assign.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableRoles.map((role) => (
              <LoadingButton
                key={role.uuid}
                variant="secondary"
                size="sm"
                isLoading={assignRole.isPending}
                onClick={() => assignRole.mutate(role.uuid)}
              >
                + {role.name}
              </LoadingButton>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
