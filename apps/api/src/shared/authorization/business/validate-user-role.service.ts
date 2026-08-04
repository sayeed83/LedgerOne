// Business layer — a guard other use cases call to confirm a User currently
// holds a specific Role (00_BUSINESS_RULES.md Ch.11.10 — Role Assignment),
// distinct from the finer-grained validate-user-permission.service.ts
// check. Read-only.
import { IAuthorizationRepository } from "../domain/interfaces/authorization-repository.interface";
import { RoleNotFoundError, UserRoleNotFoundError } from "../domain/errors/authorization.errors";

export interface ValidateUserRoleInput {
  tenantId: bigint;
  userUuid: string;
  roleUuid: string;
}

export interface ValidateUserRoleDeps {
  repository: IAuthorizationRepository;
}

export async function validateUserRole(input: ValidateUserRoleInput, deps: ValidateUserRoleDeps): Promise<void> {
  const { repository } = deps;

  const role = await repository.findRoleByUuid(input.tenantId, input.roleUuid);
  if (!role) {
    throw new RoleNotFoundError(input.roleUuid);
  }

  const assignedRoles = await repository.listRolesForUser(input.tenantId, input.userUuid);
  if (!assignedRoles.some((assigned) => assigned.uuid === role.uuid)) {
    throw new UserRoleNotFoundError(input.userUuid, role.uuid);
  }
}
