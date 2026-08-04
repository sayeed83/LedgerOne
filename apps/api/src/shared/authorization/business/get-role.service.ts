// Business layer — reads a Role by its external identifier, scoped to the
// supplied Tenant (00_BUSINESS_RULES.md Ch.11.8). Never resolves by the
// internal `id` (06_DATABASE_STANDARDS.md PK-003) — callers outside this
// module only ever hold the `uuid`.
import { IAuthorizationRepository } from "../domain/interfaces/authorization-repository.interface";
import { Role } from "../domain/aggregates/role.aggregate";
import { RoleNotFoundError } from "../domain/errors/authorization.errors";

export interface GetRoleInput {
  tenantId: bigint;
  roleUuid: string;
}

export interface GetRoleDeps {
  repository: IAuthorizationRepository;
}

export async function getRole(input: GetRoleInput, deps: GetRoleDeps): Promise<Role> {
  const role = await deps.repository.findRoleByUuid(input.tenantId, input.roleUuid);
  if (!role) {
    throw new RoleNotFoundError(input.roleUuid);
  }
  return role;
}
