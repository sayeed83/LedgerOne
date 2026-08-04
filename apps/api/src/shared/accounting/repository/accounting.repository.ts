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
  FiscalPeriod as FiscalPeriodModel,
  FiscalPeriodStatus as PrismaFiscalPeriodStatus,
} from "../../../database/generated/client";
import {
  FinancialYear,
  CreateFinancialYearProps,
  UpdateFinancialYearProps,
} from "../domain/aggregates/financial-year.aggregate";
import {
  FiscalPeriod,
  CreateFiscalPeriodProps,
  UpdateFiscalPeriodProps,
} from "../domain/aggregates/fiscal-period.aggregate";
import { FinancialYearStatus } from "../domain/enums/financial-year-status.enum";
import { FiscalPeriodStatus } from "../domain/enums/fiscal-period-status.enum";
import { FinancialYearNotFoundError, FiscalPeriodNotFoundError } from "../domain/errors/accounting.errors";
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

function toFiscalPeriodDomain(row: FiscalPeriodModel): FiscalPeriod {
  return new FiscalPeriod(
    row.id,
    row.uuid,
    row.tenantId,
    row.companyUuid,
    row.financialYearId,
    row.startDate,
    row.endDate,
    row.status as unknown as FiscalPeriodStatus,
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

  // FiscalPeriod is tenant-owned (06_DATABASE_STANDARDS.md MT-001) — every
  // query below asserts `tenantId` explicitly and independently, never
  // trusting a previously-resolved row (MT-002, Ch.6.4's worked example).
  // `id` is never accepted from outside this file (PK-003) — mutations key
  // on `(tenantId, uuid)`. `financialYearId` is a real, in-module FK
  // (accounting.prisma) — accepted as a plain bigint, no cross-repository
  // validation that the referenced Financial Year exists (that belongs to a
  // future Business-layer milestone, mirroring how `companyUuid` existence is
  // never validated here either, FK-002).

  async createFiscalPeriod(
    tenantId: bigint,
    props: CreateFiscalPeriodProps,
    tx?: RepositoryTransaction,
  ): Promise<FiscalPeriod> {
    const row = await this.client(tx).fiscalPeriod.create({
      data: {
        uuid: newUuid(),
        tenantId,
        companyUuid: props.companyUuid,
        financialYearId: props.financialYearId,
        startDate: props.startDate,
        endDate: props.endDate,
        createdBy: props.createdBy ?? null,
      },
    });
    return toFiscalPeriodDomain(row);
  }

  async findFiscalPeriodByUuid(tenantId: bigint, uuid: string): Promise<FiscalPeriod | null> {
    const row = await prisma.fiscalPeriod.findFirst({
      where: { tenantId, uuid, deletedAt: null },
    });
    return row ? toFiscalPeriodDomain(row) : null;
  }

  async listFiscalPeriods(tenantId: bigint, financialYearId?: bigint): Promise<FiscalPeriod[]> {
    const rows = await prisma.fiscalPeriod.findMany({
      where: { tenantId, financialYearId, deletedAt: null },
      orderBy: { startDate: "asc" },
    });
    return rows.map(toFiscalPeriodDomain);
  }

  async updateFiscalPeriod(
    tenantId: bigint,
    uuid: string,
    props: UpdateFiscalPeriodProps,
    tx?: RepositoryTransaction,
  ): Promise<FiscalPeriod> {
    const client = this.client(tx);
    const { count } = await client.fiscalPeriod.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: {
        startDate: props.startDate,
        endDate: props.endDate,
        updatedBy: props.updatedBy ?? undefined,
      },
    });
    if (count === 0) {
      throw new FiscalPeriodNotFoundError(uuid);
    }
    const row = await client.fiscalPeriod.findFirst({ where: { tenantId, uuid } });
    return toFiscalPeriodDomain(row as FiscalPeriodModel);
  }

  async openFiscalPeriod(
    tenantId: bigint,
    uuid: string,
    updatedBy?: bigint | null,
    tx?: RepositoryTransaction,
  ): Promise<FiscalPeriod> {
    const client = this.client(tx);
    const { count } = await client.fiscalPeriod.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: { status: PrismaFiscalPeriodStatus.OPEN, updatedBy: updatedBy ?? undefined },
    });
    if (count === 0) {
      throw new FiscalPeriodNotFoundError(uuid);
    }
    const row = await client.fiscalPeriod.findFirst({ where: { tenantId, uuid } });
    return toFiscalPeriodDomain(row as FiscalPeriodModel);
  }

  async softCloseFiscalPeriod(
    tenantId: bigint,
    uuid: string,
    updatedBy?: bigint | null,
    tx?: RepositoryTransaction,
  ): Promise<FiscalPeriod> {
    const client = this.client(tx);
    const { count } = await client.fiscalPeriod.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: { status: PrismaFiscalPeriodStatus.SOFT_CLOSED, updatedBy: updatedBy ?? undefined },
    });
    if (count === 0) {
      throw new FiscalPeriodNotFoundError(uuid);
    }
    const row = await client.fiscalPeriod.findFirst({ where: { tenantId, uuid } });
    return toFiscalPeriodDomain(row as FiscalPeriodModel);
  }

  async closeFiscalPeriod(
    tenantId: bigint,
    uuid: string,
    updatedBy?: bigint | null,
    tx?: RepositoryTransaction,
  ): Promise<FiscalPeriod> {
    const client = this.client(tx);
    const { count } = await client.fiscalPeriod.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: { status: PrismaFiscalPeriodStatus.CLOSED, updatedBy: updatedBy ?? undefined },
    });
    if (count === 0) {
      throw new FiscalPeriodNotFoundError(uuid);
    }
    const row = await client.fiscalPeriod.findFirst({ where: { tenantId, uuid } });
    return toFiscalPeriodDomain(row as FiscalPeriodModel);
  }

  async reopenFiscalPeriod(
    tenantId: bigint,
    uuid: string,
    updatedBy?: bigint | null,
    tx?: RepositoryTransaction,
  ): Promise<FiscalPeriod> {
    const client = this.client(tx);
    const { count } = await client.fiscalPeriod.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: { status: PrismaFiscalPeriodStatus.REOPENED, updatedBy: updatedBy ?? undefined },
    });
    if (count === 0) {
      throw new FiscalPeriodNotFoundError(uuid);
    }
    const row = await client.fiscalPeriod.findFirst({ where: { tenantId, uuid } });
    return toFiscalPeriodDomain(row as FiscalPeriodModel);
  }
}
