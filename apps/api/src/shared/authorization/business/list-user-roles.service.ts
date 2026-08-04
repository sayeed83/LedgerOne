// Business layer — lists the Roles currently assigned to a User
// (00_BUSINESS_RULES.md Ch.11.10). `userUuid` is a cross-module reference
// (FK-002) to User Management's `users.uuid` — trusted as given.
import { IAuthorizationRepository } from "../domain/interfaces/authorization-repository.interface";
import { Role } from "../domain/aggregates/role.aggregate";

export interface ListUserRolesInput {
  tenantId: bigint;
  userUuid: string;
}

export interface ListUserRolesDeps {
  repository: IAuthorizationRepository;
}

export async function listUserRoles(input: ListUserRolesInput, deps: ListUserRolesDeps): Promise<Role[]> {
  return deps.repository.listRolesForUser(input.tenantId, input.userUuid);
}
