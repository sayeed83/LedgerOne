// Repository layer for the Accounting module — persistence only. No
// lifecycle-transition rules (Ch.5.5/FY-004), no contiguity/overlap
// validation (FY-002, Ch.5.8), no closing-process mechanics (Ch.32), no HTTP
// concerns (05_CODING_STANDARDS.md Ch.14.4). `financial_years` is
// tenant-owned (MT-001) — every query below asserts `tenantId` explicitly.
// Only this folder (and the shared Prisma client module itself) may import
// the Prisma client, per Ch.9.5.
import { randomUUID } from "crypto";
import { prisma, PrismaTransactionClient } from "../../../database/client";
import {
  FinancialYear as FinancialYearModel,
  FinancialYearStatus as PrismaFinancialYearStatus,
} from "../../../database/generated/client";
import {
  FinancialYear,
  CreateFinancialYearProps,
  UpdateFinancialYearProps,
} from "../domain/aggregates/financial-year.aggregate";
import { FinancialYearStatus } from "../domain/enums/financial-year-status.enum";
import { FinancialYearNotFoundError } from "../domain/errors/accounting.errors";
import { IAccountingRepository, RepositoryTransaction } from "../domain/interfaces/accounting-repository.interface";

function toFinancialYearDomain(row: FinancialYearModel): FinancialYear {
  return new FinancialYear(
    row.id,
    row.uuid,
    row.tenantId,
    row.companyUuid,
    row.startDate,
    row.endDate,
    row.status as unknown as FinancialYearStatus,
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

export class PrismaAccountingRepository implements IAccountingRepository {
  private client(tx?: RepositoryTransaction): PrismaTransactionClient | typeof prisma {
    return (tx as PrismaTransactionClient | undefined) ?? prisma;
  }

  // FinancialYear is tenant-owned (06_DATABASE_STANDARDS.md MT-001) — every
  // query below asserts `tenantId` explicitly and independently, never
  // trusting a previously-resolved row (MT-002, Ch.6.4's worked example).
  // `id` is never accepted from outside this file (PK-003) — mutations key
  // on `(tenantId, uuid)`.

  async createFinancialYear(
    tenantId: bigint,
    props: CreateFinancialYearProps,
    tx?: RepositoryTransaction,
  ): Promise<FinancialYear> {
    const row = await this.client(tx).financialYear.create({
      data: {
        uuid: newUuid(),
        tenantId,
        companyUuid: props.companyUuid,
        startDate: props.startDate,
        endDate: props.endDate,
        createdBy: props.createdBy ?? null,
      },
    });
    return toFinancialYearDomain(row);
  }

  async findFinancialYearByUuid(tenantId: bigint, uuid: string): Promise<FinancialYear | null> {
    const row = await prisma.financialYear.findFirst({
      where: { tenantId, uuid, deletedAt: null },
    });
    return row ? toFinancialYearDomain(row) : null;
  }

  async listFinancialYears(tenantId: bigint, companyUuid?: string): Promise<FinancialYear[]> {
    const rows = await prisma.financialYear.findMany({
      where: { tenantId, companyUuid, deletedAt: null },
      orderBy: { startDate: "asc" },
    });
    return rows.map(toFinancialYearDomain);
  }

  async updateFinancialYear(
    tenantId: bigint,
    uuid: string,
    props: UpdateFinancialYearProps,
    tx?: RepositoryTransaction,
  ): Promise<FinancialYear> {
    const client = this.client(tx);
    const { count } = await client.financialYear.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: {
        startDate: props.startDate,
        endDate: props.endDate,
        updatedBy: props.updatedBy ?? undefined,
      },
    });
    if (count === 0) {
      throw new FinancialYearNotFoundError(uuid);
    }
    const row = await client.financialYear.findFirst({ where: { tenantId, uuid } });
    return toFinancialYearDomain(row as FinancialYearModel);
  }

  async openFinancialYear(
    tenantId: bigint,
    uuid: string,
    updatedBy?: bigint | null,
    tx?: RepositoryTransaction,
  ): Promise<FinancialYear> {
    const client = this.client(tx);
    const { count } = await client.financialYear.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: { status: PrismaFinancialYearStatus.OPEN, updatedBy: updatedBy ?? undefined },
    });
    if (count === 0) {
      throw new FinancialYearNotFoundError(uuid);
    }
    const row = await client.financialYear.findFirst({ where: { tenantId, uuid } });
    return toFinancialYearDomain(row as FinancialYearModel);
  }

  async closeFinancialYear(
    tenantId: bigint,
    uuid: string,
    updatedBy?: bigint | null,
    tx?: RepositoryTransaction,
  ): Promise<FinancialYear> {
    const client = this.client(tx);
    const { count } = await client.financialYear.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: { status: PrismaFinancialYearStatus.CLOSED, updatedBy: updatedBy ?? undefined },
    });
    if (count === 0) {
      throw new FinancialYearNotFoundError(uuid);
    }
    const row = await client.financialYear.findFirst({ where: { tenantId, uuid } });
    return toFinancialYearDomain(row as FinancialYearModel);
  }

  async reopenFinancialYear(
    tenantId: bigint,
    uuid: string,
    updatedBy?: bigint | null,
    tx?: RepositoryTransaction,
  ): Promise<FinancialYear> {
    const client = this.client(tx);
    const { count } = await client.financialYear.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: { status: PrismaFinancialYearStatus.REOPENED, updatedBy: updatedBy ?? undefined },
    });
    if (count === 0) {
      throw new FinancialYearNotFoundError(uuid);
    }
    const row = await client.financialYear.findFirst({ where: { tenantId, uuid } });
    return toFinancialYearDomain(row as FinancialYearModel);
  }
}
