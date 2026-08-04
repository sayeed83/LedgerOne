// Business layer — transitions a Role to Retired (00_BUSINESS_RULES.md
// Ch.11.5): valid only from Active. The Domain aggregate's `retire()`
// enforces the transition is legal (05_CODING_STANDARDS.md Ch.15.4) before
// this use case persists it. A Retired Role becomes non-assignable to new
// Users (see assign-role.service.ts) while existing assignments persist
// (Ch.11.5/ROL-003) — no unassignment happens here.
import { IAuthorizationRepository } from "../domain/interfaces/authorization-repository.interface";
import { Role } from "../domain/aggregates/role.aggregate";
import { RoleNotFoundError } from "../domain/errors/authorization.errors";

export interface RetireRoleInput {
  tenantId: bigint;
  roleUuid: string;
  updatedBy?: bigint | null;
}

export interface RetireRoleDeps {
  repository: IAuthorizationRepository;
}

export async function retireRole(input: RetireRoleInput, deps: RetireRoleDeps): Promise<Role> {
  const { repository } = deps;

  const role = await repository.findRoleByUuid(input.tenantId, input.roleUuid);
  if (!role) {
    throw new RoleNotFoundError(input.roleUuid);
  }

  role.retire();
  return repository.retireRole(input.tenantId, role.uuid, input.updatedBy ?? null);
}
