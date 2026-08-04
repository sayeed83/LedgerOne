// Business layer — assigns a Role to a User (00_BUSINESS_RULES.md
// Ch.10/Ch.11.10 — Role Assignment). A Retired Role cannot be assigned to a
// new User (Ch.11.5 — retiring makes a Role "no longer assignable to new
// Users," though existing assignments persist until reassigned). A User
// cannot be assigned the same Role twice (an assignment is set membership,
// not a multiset) — checked here rather than left to a raw Prisma
// unique-constraint violation bubbling out of the Repository layer
// (05_CODING_STANDARDS.md Ch.18.3). `userUuid` is a cross-module reference
// (FK-002) to User Management's `users.uuid` — trusted as given, mirroring
// User Management's own boundary note on `companyUuid`/`branchUuid`.
import { IAuthorizationRepository } from "../domain/interfaces/authorization-repository.interface";
import { UserRole } from "../domain/entities/user-role.entity";
import { RoleStatus } from "../domain/enums/role-status.enum";
import { RoleNotFoundError, RoleNotAssignableError, DuplicateRoleAssignmentError } from "../domain/errors/authorization.errors";

export interface AssignRoleInput {
  tenantId: bigint;
  userUuid: string;
  roleUuid: string;
  createdBy?: bigint | null;
}

export interface AssignRoleDeps {
  repository: IAuthorizationRepository;
}

export async function assignRole(input: AssignRoleInput, deps: AssignRoleDeps): Promise<UserRole> {
  const { repository } = deps;

  const role = await repository.findRoleByUuid(input.tenantId, input.roleUuid);
  if (!role) {
    throw new RoleNotFoundError(input.roleUuid);
  }

  if (role.status !== RoleStatus.Active) {
    throw new RoleNotAssignableError(role.uuid, role.status);
  }

  const existingAssignments = await repository.listRolesForUser(input.tenantId, input.userUuid);
  if (existingAssignments.some((assigned) => assigned.uuid === role.uuid)) {
    throw new DuplicateRoleAssignmentError(input.userUuid, role.uuid);
  }

  return repository.assignRoleToUser(input.tenantId, input.userUuid, role.id, input.createdBy ?? null);
}
