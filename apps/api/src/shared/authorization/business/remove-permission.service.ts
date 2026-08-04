// Business layer — revokes a Permission grant from a Role
// (00_BUSINESS_RULES.md Ch.11.3/Ch.12.10). Resolves both the Role
// (`roleUuid`) and the Permission (`permissionKey`) to their internal ids;
// the Repository layer itself raises `RolePermissionNotFoundError` if no
// active grant matches (already enforced at that layer — not duplicated
// here).
import { IAuthorizationRepository } from "../domain/interfaces/authorization-repository.interface";
import { RoleNotFoundError, PermissionNotFoundError } from "../domain/errors/authorization.errors";

export interface RemovePermissionInput {
  tenantId: bigint;
  roleUuid: string;
  permissionKey: string;
  updatedBy?: bigint | null;
}

export interface RemovePermissionDeps {
  repository: IAuthorizationRepository;
}

export async function removePermission(input: RemovePermissionInput, deps: RemovePermissionDeps): Promise<void> {
  const { repository } = deps;

  const role = await repository.findRoleByUuid(input.tenantId, input.roleUuid);
  if (!role) {
    throw new RoleNotFoundError(input.roleUuid);
  }

  const permission = await repository.findPermissionByKey(input.permissionKey);
  if (!permission) {
    throw new PermissionNotFoundError(input.permissionKey);
  }

  await repository.removePermissionFromRole(input.tenantId, role.id, permission.id, input.updatedBy ?? null);
}
