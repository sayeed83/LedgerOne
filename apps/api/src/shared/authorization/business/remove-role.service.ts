// Business layer — removes a Role assignment from a User
// (00_BUSINESS_RULES.md Ch.11.10). Resolves the Role (`roleUuid`) to its
// internal id; the Repository layer itself raises `UserRoleNotFoundError` if
// no active assignment matches (already enforced at that layer — not
// duplicated here).
import { IAuthorizationRepository } from "../domain/interfaces/authorization-repository.interface";
import { RoleNotFoundError } from "../domain/errors/authorization.errors";

export interface RemoveRoleInput {
  tenantId: bigint;
  userUuid: string;
  roleUuid: string;
  updatedBy?: bigint | null;
}

export interface RemoveRoleDeps {
  repository: IAuthorizationRepository;
}

export async function removeRole(input: RemoveRoleInput, deps: RemoveRoleDeps): Promise<void> {
  const { repository } = deps;

  const role = await repository.findRoleByUuid(input.tenantId, input.roleUuid);
  if (!role) {
    throw new RoleNotFoundError(input.roleUuid);
  }

  await repository.removeRoleFromUser(input.tenantId, input.userUuid, role.id, input.updatedBy ?? null);
}
