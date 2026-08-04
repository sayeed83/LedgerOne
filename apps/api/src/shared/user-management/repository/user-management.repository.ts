// Repository layer for the User Management module — persistence only. No
// lifecycle-transition rules (Ch.10.5/USR-002/USR-004), no Role/Permission
// checks, no HTTP concerns (05_CODING_STANDARDS.md Ch.14.4). `users` is
// tenant-owned (MT-001) — every query below asserts `tenantId` explicitly.
// Only this folder (and the shared Prisma client module itself) may import
// the Prisma client, per Ch.9.5.
import { randomUUID } from "crypto";
import { prisma, PrismaTransactionClient } from "../../../database/client";
import { User as UserModel, UserStatus as PrismaUserStatus } from "../../../database/generated/client";
import { User, CreateUserProps, UpdateUserProps } from "../domain/aggregates/user.aggregate";
import { UserStatus } from "../domain/enums/user-status.enum";
import { UserNotFoundError } from "../domain/errors/user-management.errors";
import { IUserManagementRepository, RepositoryTransaction } from "../domain/interfaces/user-management-repository.interface";

function toUserDomain(row: UserModel): User {
  return new User(
    row.id,
    row.uuid,
    row.tenantId,
    row.companyUuid,
    row.branchUuid,
    row.departmentUuid,
    row.firstName,
    row.middleName,
    row.lastName,
    row.displayName,
    row.email,
    row.mobileNumber,
    row.status as unknown as UserStatus,
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

export class PrismaUserManagementRepository implements IUserManagementRepository {
  private client(tx?: RepositoryTransaction): PrismaTransactionClient | typeof prisma {
    return (tx as PrismaTransactionClient | undefined) ?? prisma;
  }

  async createUser(tenantId: bigint, props: CreateUserProps, tx?: RepositoryTransaction): Promise<User> {
    const row = await this.client(tx).user.create({
      data: {
        uuid: newUuid(),
        tenantId,
        companyUuid: props.companyUuid,
        branchUuid: props.branchUuid ?? null,
        departmentUuid: props.departmentUuid ?? null,
        firstName: props.firstName,
        middleName: props.middleName ?? null,
        lastName: props.lastName,
        displayName: props.displayName ?? null,
        email: props.email,
        mobileNumber: props.mobileNumber ?? null,
        createdBy: props.createdBy ?? null,
      },
    });
    return toUserDomain(row);
  }

  async findUserByUuid(tenantId: bigint, uuid: string): Promise<User | null> {
    const row = await prisma.user.findFirst({
      where: { tenantId, uuid, deletedAt: null },
    });
    return row ? toUserDomain(row) : null;
  }

  async findUserByEmail(tenantId: bigint, email: string): Promise<User | null> {
    const row = await prisma.user.findFirst({
      where: { tenantId, email, deletedAt: null },
    });
    return row ? toUserDomain(row) : null;
  }

  async findUsersByStatus(tenantId: bigint, status: UserStatus): Promise<User[]> {
    const rows = await prisma.user.findMany({
      where: { tenantId, status: status as unknown as PrismaUserStatus, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toUserDomain);
  }

  async updateUser(tenantId: bigint, uuid: string, props: UpdateUserProps, tx?: RepositoryTransaction): Promise<User> {
    const client = this.client(tx);
    const { count } = await client.user.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: {
        companyUuid: props.companyUuid,
        branchUuid: props.branchUuid,
        departmentUuid: props.departmentUuid,
        firstName: props.firstName,
        middleName: props.middleName,
        lastName: props.lastName,
        displayName: props.displayName,
        email: props.email,
        mobileNumber: props.mobileNumber,
        updatedBy: props.updatedBy ?? undefined,
      },
    });
    if (count === 0) {
      throw new UserNotFoundError(uuid);
    }
    const row = await client.user.findFirst({ where: { tenantId, uuid } });
    return toUserDomain(row as UserModel);
  }

  async activateUser(tenantId: bigint, uuid: string, updatedBy?: bigint | null, tx?: RepositoryTransaction): Promise<User> {
    return this.setUserStatus(tenantId, uuid, PrismaUserStatus.ACTIVE, updatedBy, tx);
  }

  async suspendUser(tenantId: bigint, uuid: string, updatedBy?: bigint | null, tx?: RepositoryTransaction): Promise<User> {
    return this.setUserStatus(tenantId, uuid, PrismaUserStatus.SUSPENDED, updatedBy, tx);
  }

  async deactivateUser(tenantId: bigint, uuid: string, updatedBy?: bigint | null, tx?: RepositoryTransaction): Promise<User> {
    return this.setUserStatus(tenantId, uuid, PrismaUserStatus.DEACTIVATED, updatedBy, tx);
  }

  private async setUserStatus(
    tenantId: bigint,
    uuid: string,
    status: PrismaUserStatus,
    updatedBy: bigint | null | undefined,
    tx?: RepositoryTransaction,
  ): Promise<User> {
    const client = this.client(tx);
    const { count } = await client.user.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: { status, updatedBy: updatedBy ?? undefined },
    });
    if (count === 0) {
      throw new UserNotFoundError(uuid);
    }
    const row = await client.user.findFirst({ where: { tenantId, uuid } });
    return toUserDomain(row as UserModel);
  }

  async listUsersByTenant(tenantId: bigint): Promise<User[]> {
    const rows = await prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toUserDomain);
  }

  async listUsersByCompany(tenantId: bigint, companyUuid: string): Promise<User[]> {
    const rows = await prisma.user.findMany({
      where: { tenantId, companyUuid, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toUserDomain);
  }

  async searchUsers(tenantId: bigint, query: string): Promise<User[]> {
    const rows = await prisma.user.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { firstName: { contains: query } },
          { lastName: { contains: query } },
          { displayName: { contains: query } },
          { email: { contains: query } },
        ],
      },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toUserDomain);
  }
}
