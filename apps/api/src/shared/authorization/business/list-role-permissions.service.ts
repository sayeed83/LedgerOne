// Business layer — lists the Permissions currently granted to a Role
// (00_BUSINESS_RULES.md Ch.11.3/Ch.12.10).
import { IAuthorizationRepository } from "../domain/interfaces/authorization-repository.interface";
import { Permission } from "../domain/entities/permission.entity";
import { RoleNotFoundError } from "../domain/errors/authorization.errors";

export interface ListRolePermissionsInput {
  tenantId: bigint;
  roleUuid: string;
}

export interface ListRolePermissionsDeps {
  repository: IAuthorizationRepository;
}

export async function listRolePermissions(input: ListRolePermissionsInput, deps: ListRolePermissionsDeps): Promise<Permission[]> {
  const { repository } = deps;

  const role = await repository.findRoleByUuid(input.tenantId, input.roleUuid);
  if (!role) {
    throw new RoleNotFoundError(input.roleUuid);
  }

  return repository.listPermissionsForRole(input.tenantId, role.id);
}
