// Business layer — revises a Role's name/description (00_BUSINESS_RULES.md
// Ch.11.3). Status is never changed here (see retire-role.service.ts). If
// `name` is being changed, the new name must still be unique within the
// Tenant (Ch.11.8 — mirrors create-role.service.ts's check, and Organization's
// update-company.service.ts's exclude-self pattern).
import { IAuthorizationRepository } from "../domain/interfaces/authorization-repository.interface";
import { Role } from "../domain/aggregates/role.aggregate";
import { RoleNotFoundError, DuplicateRoleNameError } from "../domain/errors/authorization.errors";

export interface UpdateRoleInput {
  tenantId: bigint;
  roleUuid: string;
  name?: string;
  description?: string | null;
  updatedBy?: bigint | null;
}

export interface UpdateRoleDeps {
  repository: IAuthorizationRepository;
}

export async function updateRole(input: UpdateRoleInput, deps: UpdateRoleDeps): Promise<Role> {
  const { repository } = deps;

  const role = await repository.findRoleByUuid(input.tenantId, input.roleUuid);
  if (!role) {
    throw new RoleNotFoundError(input.roleUuid);
  }

  if (input.name && input.name !== role.name) {
    const existing = await repository.findRoleByName(input.tenantId, input.name);
    if (existing && existing.uuid !== role.uuid) {
      throw new DuplicateRoleNameError(input.name);
    }
  }

  return repository.updateRole(input.tenantId, role.uuid, {
    name: input.name,
    description: input.description,
    updatedBy: input.updatedBy ?? null,
  });
}
