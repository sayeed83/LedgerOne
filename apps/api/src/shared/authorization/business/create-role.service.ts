// Business layer — creates a new Role under a Tenant (00_BUSINESS_RULES.md
// Ch.11.1). The Role name must be unique within the Tenant (Ch.11.8) —
// checked here rather than left to a raw Prisma constraint violation
// bubbling out of the Repository layer (05_CODING_STANDARDS.md Ch.18.3),
// mirroring User Management's create-user.service.ts.
import { IAuthorizationRepository } from "../domain/interfaces/authorization-repository.interface";
import { Role } from "../domain/aggregates/role.aggregate";
import { DuplicateRoleNameError } from "../domain/errors/authorization.errors";

export interface CreateRoleInput {
  tenantId: bigint;
  name: string;
  description?: string | null;
  isSystemRole?: boolean;
  createdBy?: bigint | null;
}

export interface CreateRoleDeps {
  repository: IAuthorizationRepository;
}

export async function createRole(input: CreateRoleInput, deps: CreateRoleDeps): Promise<Role> {
  const { repository } = deps;

  const existing = await repository.findRoleByName(input.tenantId, input.name);
  if (existing) {
    throw new DuplicateRoleNameError(input.name);
  }

  return repository.createRole(input.tenantId, {
    name: input.name,
    description: input.description ?? null,
    isSystemRole: input.isSystemRole ?? false,
    createdBy: input.createdBy ?? null,
  });
}
