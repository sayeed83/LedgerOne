// Repository layer for the Authorization module — persistence only. No
// lifecycle-transition rules (Ch.11.5/ROL-003), no permission evaluation or
// authorization checks, no HTTP concerns (05_CODING_STANDARDS.md Ch.14.4).
// `roles`/`role_permissions`/`user_roles` are tenant-owned (MT-001) — every
// query below asserts `tenantId` explicitly. `permissions` is platform-owned
// reference data (MT-005) and is never tenant-scoped. Only this folder (and
// the shared Prisma client module itself) may import the Prisma client, per
// Ch.9.5.
import { randomUUID } from "crypto";
import { prisma, PrismaTransactionClient } from "../../../database/client";
import {
  Role as RoleModel,
  Permission as PermissionModel,
  RolePermission as RolePermissionModel,
  UserRole as UserRoleModel,
  RoleStatus as PrismaRoleStatus,
} from "../../../database/generated/client";
import { Role, CreateRoleProps, UpdateRoleProps } from "../domain/aggregates/role.aggregate";
import { RoleStatus } from "../domain/enums/role-status.enum";
import { PermissionAction } from "../domain/enums/permission-action.enum";
import { Permission } from "../domain/entities/permission.entity";
import { RolePermission } from "../domain/entities/role-permission.entity";
import { UserRole } from "../domain/entities/user-role.entity";
import { RoleNotFoundError, RolePermissionNotFoundError, UserRoleNotFoundError } from "../domain/errors/authorization.errors";
import { IAuthorizationRepository, RepositoryTransaction } from "../domain/interfaces/authorization-repository.interface";

function toRoleDomain(row: RoleModel): Role {
  return new Role(
    row.id,
    row.uuid,
    row.tenantId,
    row.name,
    row.description,
    row.isSystemRole,
    row.status as unknown as RoleStatus,
    row.createdAt,
    row.updatedAt,
    row.createdBy,
    row.updatedBy,
    row.deletedAt,
  );
}

function toPermissionDomain(row: PermissionModel): Permission {
  return new Permission(
    row.id,
    row.uuid,
    row.permissionKey,
    row.moduleName,
    row.resource,
    row.action as unknown as PermissionAction,
    row.description,
    row.createdAt,
    row.updatedAt,
    row.deletedAt,
  );
}

function toRolePermissionDomain(row: RolePermissionModel): RolePermission {
  return new RolePermission(
    row.id,
    row.uuid,
    row.tenantId,
    row.roleId,
    row.permissionId,
    row.createdAt,
    row.updatedAt,
    row.createdBy,
    row.updatedBy,
    row.deletedAt,
  );
}

function toUserRoleDomain(row: UserRoleModel): UserRole {
  return new UserRole(
    row.id,
    row.uuid,
    row.tenantId,
    row.userUuid,
    row.roleId,
    row.createdAt,
    row.updatedAt,
    row.createdBy,
    row.updatedBy,
    row.deletedAt,
  );
}

/** Generates the external identifier assigned at insert time (06_DATABASE_STANDARDS.md PK-002 — generated in the application layer, not a MySQL default expression). */
function newUuid(): string {
  return randomUUID();
}

export class PrismaAuthorizationRepository implements IAuthorizationRepository {
  private client(tx?: RepositoryTransaction): PrismaTransactionClient | typeof prisma {
    return (tx as PrismaTransactionClient | undefined) ?? prisma;
  }

  // --- Role ---
  // Role is tenant-owned (06_DATABASE_STANDARDS.md MT-001) — every query
  // below asserts `tenantId` explicitly and independently, never trusting a
  // previously-resolved row (MT-002, Ch.6.4's worked example). `id` is never
  // accepted from outside this file (PK-003) — mutations key on `(tenantId, uuid)`.

  async createRole(tenantId: bigint, props: CreateRoleProps, tx?: RepositoryTransaction): Promise<Role> {
    const row = await this.client(tx).role.create({
      data: {
        uuid: newUuid(),
        tenantId,
        name: props.name,
        description: props.description ?? null,
        isSystemRole: props.isSystemRole ?? false,
        createdBy: props.createdBy ?? null,
      },
    });
    return toRoleDomain(row);
  }

  async findRoleByUuid(tenantId: bigint, uuid: string): Promise<Role | null> {
    const row = await prisma.role.findFirst({
      where: { tenantId, uuid, deletedAt: null },
    });
    return row ? toRoleDomain(row) : null;
  }

  async findRoleByName(tenantId: bigint, name: string): Promise<Role | null> {
    const row = await prisma.role.findFirst({
      where: { tenantId, name, deletedAt: null },
    });
    return row ? toRoleDomain(row) : null;
  }

  async listRoles(tenantId: bigint): Promise<Role[]> {
    const rows = await prisma.role.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toRoleDomain);
  }

  async updateRole(tenantId: bigint, uuid: string, props: UpdateRoleProps, tx?: RepositoryTransaction): Promise<Role> {
    const client = this.client(tx);
    const { count } = await client.role.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: {
        name: props.name,
        description: props.description,
        updatedBy: props.updatedBy ?? undefined,
      },
    });
    if (count === 0) {
      throw new RoleNotFoundError(uuid);
    }
    const row = await client.role.findFirst({ where: { tenantId, uuid } });
    return toRoleDomain(row as RoleModel);
  }

  async retireRole(tenantId: bigint, uuid: string, updatedBy?: bigint | null, tx?: RepositoryTransaction): Promise<Role> {
    const client = this.client(tx);
    const { count } = await client.role.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: { status: PrismaRoleStatus.RETIRED, updatedBy: updatedBy ?? undefined },
    });
    if (count === 0) {
      throw new RoleNotFoundError(uuid);
    }
    const row = await client.role.findFirst({ where: { tenantId, uuid } });
    return toRoleDomain(row as RoleModel);
  }

  // --- Permission ---
  // Permission is platform-owned reference data (MT-005) — never
  // tenant-scoped; this Repository is read-only for it (PRM-001/12.8).

  async findPermissionByKey(permissionKey: string): Promise<Permission | null> {
    const row = await prisma.permission.findFirst({
      where: { permissionKey, deletedAt: null },
    });
    return row ? toPermissionDomain(row) : null;
  }

  async listPermissions(): Promise<Permission[]> {
    const rows = await prisma.permission.findMany({
      where: { deletedAt: null },
      orderBy: [{ moduleName: "asc" }, { permissionKey: "asc" }],
    });
    return rows.map(toPermissionDomain);
  }

  async listPermissionsByModule(moduleName: string): Promise<Permission[]> {
    const rows = await prisma.permission.findMany({
      where: { moduleName, deletedAt: null },
      orderBy: { permissionKey: "asc" },
    });
    return rows.map(toPermissionDomain);
  }

  // --- Role Permissions ---
  // RolePermission is tenant-owned (MT-001) even though reachable via Role;
  // both `roleId`/`permissionId` are this module's own in-module FKs.

  async assignPermissionToRole(
    tenantId: bigint,
    roleId: bigint,
    permissionId: bigint,
    createdBy?: bigint | null,
    tx?: RepositoryTransaction,
  ): Promise<RolePermission> {
    const row = await this.client(tx).rolePermission.create({
      data: {
        uuid: newUuid(),
        tenantId,
        roleId,
        permissionId,
        createdBy: createdBy ?? null,
      },
    });
    return toRolePermissionDomain(row);
  }

  async removePermissionFromRole(
    tenantId: bigint,
    roleId: bigint,
    permissionId: bigint,
    updatedBy?: bigint | null,
    tx?: RepositoryTransaction,
  ): Promise<void> {
    const client = this.client(tx);
    const { count } = await client.rolePermission.updateMany({
      where: { tenantId, roleId, permissionId, deletedAt: null },
      data: { deletedAt: new Date(), updatedBy: updatedBy ?? undefined },
    });
    if (count === 0) {
      throw new RolePermissionNotFoundError(roleId.toString(), permissionId.toString());
    }
  }

  async listPermissionsForRole(tenantId: bigint, roleId: bigint): Promise<Permission[]> {
    const rows = await prisma.rolePermission.findMany({
      where: { tenantId, roleId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: { permission: true },
    });
    return rows.filter((row) => row.permission.deletedAt === null).map((row) => toPermissionDomain(row.permission));
  }

  // --- User Roles ---
  // UserRole is tenant-owned (MT-001). `userUuid` is a cross-module
  // reference (FK-002) to User Management's `users.uuid` — no DB-level FK;
  // `roleId` is this module's own in-module FK.

  async assignRoleToUser(
    tenantId: bigint,
    userUuid: string,
    roleId: bigint,
    createdBy?: bigint | null,
    tx?: RepositoryTransaction,
  ): Promise<UserRole> {
    const row = await this.client(tx).userRole.create({
      data: {
        uuid: newUuid(),
        tenantId,
        userUuid,
        roleId,
        createdBy: createdBy ?? null,
      },
    });
    return toUserRoleDomain(row);
  }

  async removeRoleFromUser(
    tenantId: bigint,
    userUuid: string,
    roleId: bigint,
    updatedBy?: bigint | null,
    tx?: RepositoryTransaction,
  ): Promise<void> {
    const client = this.client(tx);
    const { count } = await client.userRole.updateMany({
      where: { tenantId, userUuid, roleId, deletedAt: null },
      data: { deletedAt: new Date(), updatedBy: updatedBy ?? undefined },
    });
    if (count === 0) {
      throw new UserRoleNotFoundError(userUuid, roleId.toString());
    }
  }

  async listRolesForUser(tenantId: bigint, userUuid: string): Promise<Role[]> {
    const rows = await prisma.userRole.findMany({
      where: { tenantId, userUuid, deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: { role: true },
    });
    return rows.filter((row) => row.role.deletedAt === null).map((row) => toRoleDomain(row.role));
  }
}
