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
  Currency as CurrencyModel,
  CurrencyStatus as PrismaCurrencyStatus,
  ExchangeRate as ExchangeRateModel,
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
import { Currency, CreateCurrencyProps, UpdateCurrencyProps } from "../domain/aggregates/currency.aggregate";
import { ExchangeRate, CreateExchangeRateProps } from "../domain/entities/exchange-rate.entity";
import { DecimalValue } from "../domain/value-objects/decimal-value.value-object";
import { FinancialYearStatus } from "../domain/enums/financial-year-status.enum";
import { FiscalPeriodStatus } from "../domain/enums/fiscal-period-status.enum";
import { CurrencyStatus } from "../domain/enums/currency-status.enum";
import {
  FinancialYearNotFoundError,
  FiscalPeriodNotFoundError,
  CurrencyNotFoundError,
} from "../domain/errors/accounting.errors";
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

function toCurrencyDomain(row: CurrencyModel): Currency {
  return new Currency(
    row.id,
    row.uuid,
    row.isoCode,
    row.name,
    row.symbol,
    row.decimalPrecision,
    row.status as unknown as CurrencyStatus,
    row.createdAt,
    row.updatedAt,
    row.deletedAt,
  );
}

function toExchangeRateDomain(row: ExchangeRateModel): ExchangeRate {
  return new ExchangeRate(
    row.id,
    row.uuid,
    row.tenantId,
    row.fromCurrencyId,
    row.toCurrencyId,
    // `.toFixed()` (not `.toString()`) guarantees plain fixed-point decimal
    // notation, never exponential notation, as the input to `DecimalValue`
    // (decimal-value.value-object.ts's pattern only accepts fixed notation).
    DecimalValue.create(row.rate.toFixed()),
    row.effectiveDate,
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

  // Currency is platform-owned reference data (06_DATABASE_STANDARDS.md
  // MT-005, mirrors Authorization's Permission) — no `tenantId` on any
  // method. `id` is never accepted from outside this file (PK-003) —
  // mutations key on `uuid`.

  async createCurrency(props: CreateCurrencyProps, tx?: RepositoryTransaction): Promise<Currency> {
    const row = await this.client(tx).currency.create({
      data: {
        uuid: newUuid(),
        isoCode: props.isoCode,
        name: props.name,
        symbol: props.symbol,
        decimalPrecision: props.decimalPrecision,
      },
    });
    return toCurrencyDomain(row);
  }

  async findCurrencyByUuid(uuid: string): Promise<Currency | null> {
    const row = await prisma.currency.findFirst({ where: { uuid, deletedAt: null } });
    return row ? toCurrencyDomain(row) : null;
  }

  async findCurrencyByIsoCode(isoCode: string): Promise<Currency | null> {
    const row = await prisma.currency.findFirst({ where: { isoCode, deletedAt: null } });
    return row ? toCurrencyDomain(row) : null;
  }

  async listCurrencies(status?: CurrencyStatus): Promise<Currency[]> {
    const rows = await prisma.currency.findMany({
      where: {
        status: status ? (status as unknown as PrismaCurrencyStatus) : undefined,
        deletedAt: null,
      },
      orderBy: { isoCode: "asc" },
    });
    return rows.map(toCurrencyDomain);
  }

  async updateCurrency(uuid: string, props: UpdateCurrencyProps, tx?: RepositoryTransaction): Promise<Currency> {
    const client = this.client(tx);
    const { count } = await client.currency.updateMany({
      where: { uuid, deletedAt: null },
      data: {
        name: props.name,
        symbol: props.symbol,
        decimalPrecision: props.decimalPrecision,
      },
    });
    if (count === 0) {
      throw new CurrencyNotFoundError(uuid);
    }
    const row = await client.currency.findFirst({ where: { uuid } });
    return toCurrencyDomain(row as CurrencyModel);
  }

  async activateCurrency(uuid: string, tx?: RepositoryTransaction): Promise<Currency> {
    const client = this.client(tx);
    const { count } = await client.currency.updateMany({
      where: { uuid, deletedAt: null },
      data: { status: PrismaCurrencyStatus.ACTIVE },
    });
    if (count === 0) {
      throw new CurrencyNotFoundError(uuid);
    }
    const row = await client.currency.findFirst({ where: { uuid } });
    return toCurrencyDomain(row as CurrencyModel);
  }

  async deactivateCurrency(uuid: string, tx?: RepositoryTransaction): Promise<Currency> {
    const client = this.client(tx);
    const { count } = await client.currency.updateMany({
      where: { uuid, deletedAt: null },
      data: { status: PrismaCurrencyStatus.INACTIVE },
    });
    if (count === 0) {
      throw new CurrencyNotFoundError(uuid);
    }
    const row = await client.currency.findFirst({ where: { uuid } });
    return toCurrencyDomain(row as CurrencyModel);
  }

  // ExchangeRate is tenant-owned (06_DATABASE_STANDARDS.md MT-001) — every
  // query below asserts `tenantId` explicitly and independently (MT-002).
  // `fromCurrencyId`/`toCurrencyId` are real, in-module FKs
  // (accounting.prisma) — accepted as plain bigints, no cross-repository
  // validation that the referenced Currency exists (a future Business-layer
  // concern, mirroring how `financialYearId`/`companyUuid` existence is
  // never validated here either). Immutable historical time series
  // (Ch.31.5/EXR-002) — no update/remove method.

  async createExchangeRate(
    tenantId: bigint,
    props: CreateExchangeRateProps,
    tx?: RepositoryTransaction,
  ): Promise<ExchangeRate> {
    const row = await this.client(tx).exchangeRate.create({
      data: {
        uuid: newUuid(),
        tenantId,
        fromCurrencyId: props.fromCurrencyId,
        toCurrencyId: props.toCurrencyId,
        // `DecimalValue.toString()` — Prisma's `Decimal` field accepts a
        // plain decimal string as create input.
        rate: props.rate.toString(),
        effectiveDate: props.effectiveDate,
        createdBy: props.createdBy ?? null,
      },
    });
    return toExchangeRateDomain(row);
  }

  async findExchangeRateByUuid(tenantId: bigint, uuid: string): Promise<ExchangeRate | null> {
    const row = await prisma.exchangeRate.findFirst({
      where: { tenantId, uuid, deletedAt: null },
    });
    return row ? toExchangeRateDomain(row) : null;
  }

  async listExchangeRates(
    tenantId: bigint,
    fromCurrencyId?: bigint,
    toCurrencyId?: bigint,
  ): Promise<ExchangeRate[]> {
    const rows = await prisma.exchangeRate.findMany({
      where: { tenantId, fromCurrencyId, toCurrencyId, deletedAt: null },
      orderBy: { effectiveDate: "desc" },
    });
    return rows.map(toExchangeRateDomain);
  }
}
