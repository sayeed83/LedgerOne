// Business layer — grants a Permission to a Role (00_BUSINESS_RULES.md
// Ch.11.3/Ch.12.10 — "Role grants Permission"). A Role cannot be granted the
// same Permission twice (a grant is set membership, not a multiset) —
// checked here rather than left to a raw Prisma unique-constraint violation
// bubbling out of the Repository layer (05_CODING_STANDARDS.md Ch.18.3),
// mirroring create-user.service.ts's duplicate-check pattern. Resolves both
// the Role (`roleUuid`) and the Permission (`permissionKey`) to their
// internal ids before calling the Repository, mirroring Organization's
// `createBranch` resolving its parent Company first.
import { IAuthorizationRepository } from "../domain/interfaces/authorization-repository.interface";
import { RolePermission } from "../domain/entities/role-permission.entity";
import { RoleNotFoundError, PermissionNotFoundError, DuplicatePermissionAssignmentError } from "../domain/errors/authorization.errors";

export interface AssignPermissionInput {
  tenantId: bigint;
  roleUuid: string;
  permissionKey: string;
  createdBy?: bigint | null;
}

export interface AssignPermissionDeps {
  repository: IAuthorizationRepository;
}

export async function assignPermission(input: AssignPermissionInput, deps: AssignPermissionDeps): Promise<RolePermission> {
  const { repository } = deps;

  const role = await repository.findRoleByUuid(input.tenantId, input.roleUuid);
  if (!role) {
    throw new RoleNotFoundError(input.roleUuid);
  }

  const permission = await repository.findPermissionByKey(input.permissionKey);
  if (!permission) {
    throw new PermissionNotFoundError(input.permissionKey);
  }

  const existingGrants = await repository.listPermissionsForRole(input.tenantId, role.id);
  if (existingGrants.some((granted) => granted.permissionKey === permission.permissionKey)) {
    throw new DuplicatePermissionAssignmentError(role.uuid, permission.permissionKey);
  }

  return repository.assignPermissionToRole(input.tenantId, role.id, permission.id, input.createdBy ?? null);
}
