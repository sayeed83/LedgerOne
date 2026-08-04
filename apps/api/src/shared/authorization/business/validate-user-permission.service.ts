// Business layer — the authoritative authorization check other modules'
// use cases call before allowing a permission-gated operation to proceed
// (03_ARCHITECTURE.md Ch.9.8: "The authoritative authorization check for any
// state-changing or sensitive-read operation must be enforced in the
// Business layer... never solely in the Presentation layer", Decision
// 9.9.3 — testable independently of HTTP). Aggregates the Permissions
// granted across every Role currently assigned to the User and checks
// whether the requested `permissionKey` appears among them. A Retired
// Role's existing grants still count (00_BUSINESS_RULES.md Ch.11.5 —
// assignments persist after retirement; only *new* assignment is blocked,
// see assign-role.service.ts). Read-only.
import { IAuthorizationRepository } from "../domain/interfaces/authorization-repository.interface";
import { PermissionDeniedError } from "../domain/errors/authorization.errors";

export interface ValidateUserPermissionInput {
  tenantId: bigint;
  userUuid: string;
  permissionKey: string;
}

export interface ValidateUserPermissionDeps {
  repository: IAuthorizationRepository;
}

export async function validateUserPermission(input: ValidateUserPermissionInput, deps: ValidateUserPermissionDeps): Promise<void> {
  const { repository } = deps;

  const roles = await repository.listRolesForUser(input.tenantId, input.userUuid);

  for (const role of roles) {
    const grantedPermissions = await repository.listPermissionsForRole(input.tenantId, role.id);
    if (grantedPermissions.some((permission) => permission.permissionKey === input.permissionKey)) {
      return;
    }
  }

  throw new PermissionDeniedError(input.userUuid, input.permissionKey);
}
