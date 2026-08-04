// Shared test fixtures/fakes for Business-layer unit tests
// (05_CODING_STANDARDS.md Ch.10.6 — a unit test constructs a fake `deps`
// object directly, no mocking framework/container required). Not a
// `.service.ts` file itself, so it carries no use-case naming suffix.
import { Role } from "../../domain/aggregates/role.aggregate";
import { RoleStatus } from "../../domain/enums/role-status.enum";
import { Permission } from "../../domain/entities/permission.entity";
import { PermissionAction } from "../../domain/enums/permission-action.enum";
import { RolePermission } from "../../domain/entities/role-permission.entity";
import { UserRole } from "../../domain/entities/user-role.entity";
import { IAuthorizationRepository } from "../../domain/interfaces/authorization-repository.interface";

export function buildRole(overrides: Partial<Role> = {}): Role {
  const base = new Role(
    1n,
    "00000000-0000-0000-0000-000000000001",
    1n,
    "Accountant",
    "Standard accounting role",
    false,
    RoleStatus.Active,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(Role.prototype), base, overrides) as Role;
}

export function buildPermission(overrides: Partial<Permission> = {}): Permission {
  const base = new Permission(
    1n,
    "00000000-0000-0000-0000-000000000010",
    "accounting.journal_entry.post",
    "accounting",
    "journal_entry",
    PermissionAction.Approve,
    "Post a Journal Entry",
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
  );
  return Object.assign(Object.create(Permission.prototype), base, overrides) as Permission;
}

export function buildRolePermission(overrides: Partial<RolePermission> = {}): RolePermission {
  const base = new RolePermission(
    1n,
    "00000000-0000-0000-0000-000000000020",
    1n,
    1n,
    1n,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(RolePermission.prototype), base, overrides) as RolePermission;
}

export function buildUserRole(overrides: Partial<UserRole> = {}): UserRole {
  const base = new UserRole(
    1n,
    "00000000-0000-0000-0000-000000000030",
    1n,
    "00000000-0000-0000-0000-000000000099",
    1n,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(UserRole.prototype), base, overrides) as UserRole;
}

export function createFakeAuthorizationRepository(): jest.Mocked<IAuthorizationRepository> {
  return {
    createRole: jest.fn(),
    findRoleByUuid: jest.fn(),
    findRoleByName: jest.fn(),
    listRoles: jest.fn(),
    updateRole: jest.fn(),
    retireRole: jest.fn(),
    findPermissionByKey: jest.fn(),
    listPermissions: jest.fn(),
    listPermissionsByModule: jest.fn(),
    assignPermissionToRole: jest.fn(),
    removePermissionFromRole: jest.fn(),
    listPermissionsForRole: jest.fn(),
    assignRoleToUser: jest.fn(),
    removeRoleFromUser: jest.fn(),
    listRolesForUser: jest.fn(),
  };
}
