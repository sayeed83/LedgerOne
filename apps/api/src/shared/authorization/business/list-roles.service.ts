// Business layer — lists Roles within a Tenant (00_BUSINESS_RULES.md
// Ch.11.1).
import { IAuthorizationRepository } from "../domain/interfaces/authorization-repository.interface";
import { Role } from "../domain/aggregates/role.aggregate";

export interface ListRolesInput {
  tenantId: bigint;
}

export interface ListRolesDeps {
  repository: IAuthorizationRepository;
}

export async function listRoles(input: ListRolesInput, deps: ListRolesDeps): Promise<Role[]> {
  return deps.repository.listRoles(input.tenantId);
}
