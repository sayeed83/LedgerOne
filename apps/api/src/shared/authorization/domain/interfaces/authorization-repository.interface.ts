// Repository interface, owned by the Domain layer per 03_ARCHITECTURE.md
// Decision 5.7.2 — the Repository layer provides the implementation, never
// the contract. Every method is persistence-only (05_CODING_STANDARDS.md
// Ch.14.4): no lifecycle-transition rules (Ch.11.5/ROL-003), no permission
// evaluation/authorization checks — those are Business-layer concerns that
// call these methods (03_ARCHITECTURE.md Ch.9.8/Decision 9.9.3, the same
// "Repository is persistence-only" boundary as every other module). Find
// methods return `null`, never throw, when nothing matches
// (05_CODING_STANDARDS.md Ch.8.5/Ch.14).
//
// Role, RolePermission, and UserRole are tenant-owned (06_DATABASE_STANDARDS.md
// MT-001, no convenience exceptions) — every method takes `tenantId`
// explicitly and re-asserts it in its own query, never relying on a
// previously-resolved row's identity (MT-002, Ch.6.4's worked example).
// Permission is platform-owned reference data (MT-005) — declared by its
// owning module (03_ARCHITECTURE.md Decision 9.9.1), not tenant-scoped, and
// this module's Repository is read-only for it (find/list only).
//
// `userUuid` on the User Role methods is a cross-module reference (FK-002)
// to User Management's `users.uuid` — looked up/filtered by `uuid`, never a
// numeric id from another module's schema, mirroring User Management's own
// `companyUuid`/`branchUuid`/`departmentUuid` references into Organization.
// `roleId`/`permissionId` are this module's own internal ids, resolved by the
// Business layer (not built yet) via `findRoleByUuid`/`findPermissionByKey`
// before being passed in — the same pattern Organization's
// `createBranch(tenantId, companyId, ...)` uses for its own in-module parent.
import { Role, CreateRoleProps, UpdateRoleProps } from "../aggregates/role.aggregate";
import { Permission } from "../entities/permission.entity";
import { RolePermission } from "../entities/role-permission.entity";
import { UserRole } from "../entities/user-role.entity";

/**
 * Opaque handle for an in-flight transaction, supplied by the Business
 * layer's `$transaction` callback (03_ARCHITECTURE.md Decision 5.7.3 —
 * transactions are opened only at the Business layer) and passed through
 * unmodified. Kept as `unknown` rather than a Prisma-specific type so this
 * Domain-owned interface stays free of ORM types (Ch.5.3.4); the Repository
 * implementation casts it back to Prisma's transaction client internally.
 */
export type RepositoryTransaction = unknown;

export interface IAuthorizationRepository {
  // --- Role ---
  createRole(tenantId: bigint, props: CreateRoleProps, tx?: RepositoryTransaction): Promise<Role>;
  findRoleByUuid(tenantId: bigint, uuid: string): Promise<Role | null>;
  findRoleByName(tenantId: bigint, name: string): Promise<Role | null>;
  listRoles(tenantId: bigint): Promise<Role[]>;
  updateRole(tenantId: bigint, uuid: string, props: UpdateRoleProps, tx?: RepositoryTransaction): Promise<Role>;
  /** Sets status to Retired (00_BUSINESS_RULES.md Ch.11.5) — a raw persistence transition; validating the `from` state is a Business-layer concern (this milestone is Repository-only). */
  retireRole(tenantId: bigint, uuid: string, updatedBy?: bigint | null, tx?: RepositoryTransaction): Promise<Role>;

  // --- Permission ---
  findPermissionByKey(permissionKey: string): Promise<Permission | null>;
  listPermissions(): Promise<Permission[]>;
  listPermissionsByModule(moduleName: string): Promise<Permission[]>;

  // --- Role Permissions ---
  assignPermissionToRole(
    tenantId: bigint,
    roleId: bigint,
    permissionId: bigint,
    createdBy?: bigint | null,
    tx?: RepositoryTransaction,
  ): Promise<RolePermission>;
  removePermissionFromRole(
    tenantId: bigint,
    roleId: bigint,
    permissionId: bigint,
    updatedBy?: bigint | null,
    tx?: RepositoryTransaction,
  ): Promise<void>;
  /** Returns the granted Permissions themselves (joined via `role_permissions`, in-module), not the join rows. */
  listPermissionsForRole(tenantId: bigint, roleId: bigint): Promise<Permission[]>;

  // --- User Roles ---
  assignRoleToUser(
    tenantId: bigint,
    userUuid: string,
    roleId: bigint,
    createdBy?: bigint | null,
    tx?: RepositoryTransaction,
  ): Promise<UserRole>;
  removeRoleFromUser(
    tenantId: bigint,
    userUuid: string,
    roleId: bigint,
    updatedBy?: bigint | null,
    tx?: RepositoryTransaction,
  ): Promise<void>;
  /** Returns the assigned Roles themselves (joined via `user_roles`, in-module), not the join rows. */
  listRolesForUser(tenantId: bigint, userUuid: string): Promise<Role[]>;
}
