// Repository layer for the Organization module — persistence only. No
// lifecycle-transition rules (ORG-001/002/005), no module entitlement checks
// (ORG-004), no HTTP concerns (05_CODING_STANDARDS.md Ch.14.4). `tenants`
// carries no `tenant_id` (it IS the tenant registry, platform-owned per
// MT-005) so its queries are keyed by its own `id`/`uuid`/`status`;
// `TenantSettings`/`TenantSubscription` are tenant-owned child rows and are
// always scoped by `tenantId` (Ch.14.5). Only this folder (and the shared
// Prisma client module itself) may import the Prisma client, per Ch.9.5.
import { randomUUID } from "crypto";
import { prisma, PrismaTransactionClient } from "../../../database/client";
import {
  Tenant as TenantModel,
  TenantSettings as TenantSettingsModel,
  TenantSubscription as TenantSubscriptionModel,
  Company as CompanyModel,
  Branch as BranchModel,
  Department as DepartmentModel,
  TenantStatus as PrismaTenantStatus,
  TenantSubscriptionStatus as PrismaTenantSubscriptionStatus,
  CompanyStatus as PrismaCompanyStatus,
} from "../../../database/generated/client";
import { Tenant, CreateTenantProps, UpdateTenantProps } from "../domain/aggregates/tenant.aggregate";
import { Company, CreateCompanyProps, UpdateCompanyProps } from "../domain/aggregates/company.aggregate";
import { TenantStatus } from "../domain/enums/tenant-status.enum";
import { TenantSubscriptionStatus } from "../domain/enums/tenant-subscription-status.enum";
import { CompanyStatus } from "../domain/enums/company-status.enum";
import { BranchStatus } from "../domain/enums/branch-status.enum";
import { DepartmentStatus } from "../domain/enums/department-status.enum";
import {
  TenantSettings,
  CreateTenantSettingsProps,
  UpdateTenantSettingsProps,
} from "../domain/entities/tenant-settings.entity";
import {
  TenantSubscription,
  CreateTenantSubscriptionProps,
  UpdateTenantSubscriptionProps,
} from "../domain/entities/tenant-subscription.entity";
import { Branch, CreateBranchProps, UpdateBranchProps } from "../domain/entities/branch.entity";
import { Department, CreateDepartmentProps, UpdateDepartmentProps } from "../domain/entities/department.entity";
import { CompanyNotFoundError, BranchNotFoundError, DepartmentNotFoundError } from "../domain/errors/organization.errors";
import { IOrganizationRepository, RepositoryTransaction } from "../domain/interfaces/organization-repository.interface";

function toTenantDomain(row: TenantModel): Tenant {
  return new Tenant(
    row.id,
    row.uuid,
    row.legalName,
    row.primaryContactEmail,
    row.status as unknown as TenantStatus,
    row.createdAt,
    row.updatedAt,
    row.createdBy,
    row.updatedBy,
    row.deletedAt,
  );
}

function toTenantSettingsDomain(row: TenantSettingsModel): TenantSettings {
  return new TenantSettings(
    row.id,
    row.uuid,
    row.tenantId,
    row.defaultCurrencyCode,
    row.defaultTimeZone,
    row.defaultFinancialYearPattern,
    row.createdAt,
    row.updatedAt,
    row.createdBy,
    row.updatedBy,
    row.deletedAt,
  );
}

function toTenantSubscriptionDomain(row: TenantSubscriptionModel): TenantSubscription {
  return new TenantSubscription(
    row.id,
    row.uuid,
    row.tenantId,
    row.planCode,
    row.subscribedModules as string[],
    row.status as unknown as TenantSubscriptionStatus,
    row.currentPeriodStartsAt,
    row.currentPeriodEndsAt,
    row.cancelledAt,
    row.createdAt,
    row.updatedAt,
    row.createdBy,
    row.updatedBy,
    row.deletedAt,
  );
}

function toCompanyDomain(row: CompanyModel): Company {
  return new Company(
    row.id,
    row.uuid,
    row.tenantId,
    row.companyCode,
    row.legalName,
    row.displayName,
    row.legalEntityType,
    row.taxRegistrationNumber,
    row.baseCurrencyCode,
    row.country,
    row.timeZone,
    row.financialYearStartMonth,
    row.financialYearStartDay,
    row.status as unknown as CompanyStatus,
    row.createdAt,
    row.updatedAt,
    row.createdBy,
    row.updatedBy,
    row.deletedAt,
  );
}

function toBranchDomain(row: BranchModel): Branch {
  return new Branch(
    row.id,
    row.uuid,
    row.tenantId,
    row.companyId,
    row.branchCode,
    row.branchName,
    row.status as unknown as BranchStatus,
    row.addressLine1,
    row.addressLine2,
    row.city,
    row.region,
    row.postalCode,
    row.countryCode,
    row.timeZone,
    row.createdAt,
    row.updatedAt,
    row.createdBy,
    row.updatedBy,
    row.deletedAt,
  );
}

function toDepartmentDomain(row: DepartmentModel): Department {
  return new Department(
    row.id,
    row.uuid,
    row.tenantId,
    row.companyId,
    row.departmentCode,
    row.departmentName,
    row.status as unknown as DepartmentStatus,
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

export class PrismaOrganizationRepository implements IOrganizationRepository {
  private client(tx?: RepositoryTransaction): PrismaTransactionClient | typeof prisma {
    return (tx as PrismaTransactionClient | undefined) ?? prisma;
  }

  // --- Tenant ---

  async createTenant(props: CreateTenantProps, tx?: RepositoryTransaction): Promise<Tenant> {
    const row = await this.client(tx).tenant.create({
      data: {
        uuid: newUuid(),
        legalName: props.legalName,
        primaryContactEmail: props.primaryContactEmail,
        createdBy: props.createdBy ?? null,
      },
    });
    return toTenantDomain(row);
  }

  async findTenantById(id: bigint): Promise<Tenant | null> {
    const row = await prisma.tenant.findFirst({
      where: { id, deletedAt: null },
    });
    return row ? toTenantDomain(row) : null;
  }

  async findTenantByUuid(uuid: string): Promise<Tenant | null> {
    const row = await prisma.tenant.findFirst({
      where: { uuid, deletedAt: null },
    });
    return row ? toTenantDomain(row) : null;
  }

  async findTenantsByStatus(status: TenantStatus): Promise<Tenant[]> {
    const rows = await prisma.tenant.findMany({
      where: { status: status as unknown as PrismaTenantStatus, deletedAt: null },
    });
    return rows.map(toTenantDomain);
  }

  async updateTenant(id: bigint, props: UpdateTenantProps, tx?: RepositoryTransaction): Promise<Tenant> {
    const row = await this.client(tx).tenant.update({
      where: { id },
      data: {
        legalName: props.legalName,
        primaryContactEmail: props.primaryContactEmail,
        updatedBy: props.updatedBy ?? undefined,
      },
    });
    return toTenantDomain(row);
  }

  async updateTenantStatus(
    id: bigint,
    status: TenantStatus,
    updatedBy?: bigint | null,
    tx?: RepositoryTransaction,
  ): Promise<Tenant> {
    const row = await this.client(tx).tenant.update({
      where: { id },
      data: {
        status: status as unknown as PrismaTenantStatus,
        updatedBy: updatedBy ?? undefined,
      },
    });
    return toTenantDomain(row);
  }

  // --- Tenant settings ---

  async getTenantSettings(tenantId: bigint): Promise<TenantSettings | null> {
    const row = await prisma.tenantSettings.findFirst({
      where: { tenantId, deletedAt: null },
    });
    return row ? toTenantSettingsDomain(row) : null;
  }

  async createTenantSettings(
    tenantId: bigint,
    props: CreateTenantSettingsProps,
    tx?: RepositoryTransaction,
  ): Promise<TenantSettings> {
    const row = await this.client(tx).tenantSettings.create({
      data: {
        uuid: newUuid(),
        tenantId,
        defaultCurrencyCode: props.defaultCurrencyCode,
        defaultTimeZone: props.defaultTimeZone,
        defaultFinancialYearPattern: props.defaultFinancialYearPattern,
        createdBy: props.createdBy ?? null,
      },
    });
    return toTenantSettingsDomain(row);
  }

  async updateTenantSettings(
    tenantId: bigint,
    props: UpdateTenantSettingsProps,
    tx?: RepositoryTransaction,
  ): Promise<TenantSettings> {
    const row = await this.client(tx).tenantSettings.update({
      where: { tenantId },
      data: {
        defaultCurrencyCode: props.defaultCurrencyCode,
        defaultTimeZone: props.defaultTimeZone,
        defaultFinancialYearPattern: props.defaultFinancialYearPattern,
        updatedBy: props.updatedBy ?? undefined,
      },
    });
    return toTenantSettingsDomain(row);
  }

  // --- Tenant subscription ---

  async getTenantSubscription(tenantId: bigint): Promise<TenantSubscription | null> {
    const row = await prisma.tenantSubscription.findFirst({
      where: { tenantId, deletedAt: null },
    });
    return row ? toTenantSubscriptionDomain(row) : null;
  }

  async createTenantSubscription(
    tenantId: bigint,
    props: CreateTenantSubscriptionProps,
    tx?: RepositoryTransaction,
  ): Promise<TenantSubscription> {
    const row = await this.client(tx).tenantSubscription.create({
      data: {
        uuid: newUuid(),
        tenantId,
        planCode: props.planCode,
        subscribedModules: props.subscribedModules,
        currentPeriodStartsAt: props.currentPeriodStartsAt,
        currentPeriodEndsAt: props.currentPeriodEndsAt,
        createdBy: props.createdBy ?? null,
      },
    });
    return toTenantSubscriptionDomain(row);
  }

  async updateTenantSubscription(
    tenantId: bigint,
    props: UpdateTenantSubscriptionProps,
    tx?: RepositoryTransaction,
  ): Promise<TenantSubscription> {
    const row = await this.client(tx).tenantSubscription.update({
      where: { tenantId },
      data: {
        planCode: props.planCode,
        subscribedModules: props.subscribedModules,
        status: props.status as unknown as PrismaTenantSubscriptionStatus,
        currentPeriodStartsAt: props.currentPeriodStartsAt,
        currentPeriodEndsAt: props.currentPeriodEndsAt,
        cancelledAt: props.cancelledAt,
        updatedBy: props.updatedBy ?? undefined,
      },
    });
    return toTenantSubscriptionDomain(row);
  }

  // --- Company ---
  // Company is tenant-owned (06_DATABASE_STANDARDS.md MT-001) — every query
  // below asserts `tenantId` explicitly and independently, never trusting a
  // previously-resolved row (MT-002, Ch.6.4's worked example). `id` is never
  // accepted from outside this file (PK-003) — mutations key on `(tenantId, uuid)`.

  async createCompany(tenantId: bigint, props: CreateCompanyProps, tx?: RepositoryTransaction): Promise<Company> {
    const row = await this.client(tx).company.create({
      data: {
        uuid: newUuid(),
        tenantId,
        companyCode: props.companyCode,
        legalName: props.legalName,
        displayName: props.displayName ?? null,
        legalEntityType: props.legalEntityType ?? null,
        taxRegistrationNumber: props.taxRegistrationNumber,
        baseCurrencyCode: props.baseCurrencyCode,
        country: props.country,
        timeZone: props.timeZone,
        financialYearStartMonth: props.financialYearStartMonth,
        financialYearStartDay: props.financialYearStartDay,
        createdBy: props.createdBy ?? null,
      },
    });
    return toCompanyDomain(row);
  }

  async findCompanyByUuid(tenantId: bigint, uuid: string): Promise<Company | null> {
    const row = await prisma.company.findFirst({
      where: { tenantId, uuid, deletedAt: null },
    });
    return row ? toCompanyDomain(row) : null;
  }

  async listCompaniesByTenant(tenantId: bigint): Promise<Company[]> {
    const rows = await prisma.company.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toCompanyDomain);
  }

  async updateCompany(
    tenantId: bigint,
    uuid: string,
    props: UpdateCompanyProps,
    tx?: RepositoryTransaction,
  ): Promise<Company> {
    const client = this.client(tx);
    const { count } = await client.company.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: {
        companyCode: props.companyCode,
        legalName: props.legalName,
        displayName: props.displayName,
        legalEntityType: props.legalEntityType,
        taxRegistrationNumber: props.taxRegistrationNumber,
        baseCurrencyCode: props.baseCurrencyCode,
        country: props.country,
        timeZone: props.timeZone,
        financialYearStartMonth: props.financialYearStartMonth,
        financialYearStartDay: props.financialYearStartDay,
        updatedBy: props.updatedBy ?? undefined,
      },
    });
    if (count === 0) {
      throw new CompanyNotFoundError(uuid);
    }
    const row = await client.company.findFirst({ where: { tenantId, uuid } });
    return toCompanyDomain(row as CompanyModel);
  }

  async activateCompany(
    tenantId: bigint,
    uuid: string,
    updatedBy?: bigint | null,
    tx?: RepositoryTransaction,
  ): Promise<Company> {
    return this.setCompanyStatus(tenantId, uuid, PrismaCompanyStatus.ACTIVE, updatedBy, tx);
  }

  async deactivateCompany(
    tenantId: bigint,
    uuid: string,
    updatedBy?: bigint | null,
    tx?: RepositoryTransaction,
  ): Promise<Company> {
    return this.setCompanyStatus(tenantId, uuid, PrismaCompanyStatus.CLOSED, updatedBy, tx);
  }

  private async setCompanyStatus(
    tenantId: bigint,
    uuid: string,
    status: PrismaCompanyStatus,
    updatedBy: bigint | null | undefined,
    tx?: RepositoryTransaction,
  ): Promise<Company> {
    const client = this.client(tx);
    const { count } = await client.company.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: { status, updatedBy: updatedBy ?? undefined },
    });
    if (count === 0) {
      throw new CompanyNotFoundError(uuid);
    }
    const row = await client.company.findFirst({ where: { tenantId, uuid } });
    return toCompanyDomain(row as CompanyModel);
  }

  // --- Branch ---
  // Branch is tenant-owned (MT-001) and belongs to exactly one Company
  // (BRN-001) — every query below asserts `tenantId` explicitly.

  async createBranch(
    tenantId: bigint,
    companyId: bigint,
    props: CreateBranchProps,
    tx?: RepositoryTransaction,
  ): Promise<Branch> {
    const row = await this.client(tx).branch.create({
      data: {
        uuid: newUuid(),
        tenantId,
        companyId,
        branchCode: props.branchCode,
        branchName: props.branchName,
        addressLine1: props.addressLine1,
        addressLine2: props.addressLine2 ?? null,
        city: props.city,
        region: props.region ?? null,
        postalCode: props.postalCode ?? null,
        countryCode: props.countryCode,
        timeZone: props.timeZone,
        createdBy: props.createdBy ?? null,
      },
    });
    return toBranchDomain(row);
  }

  async findBranchByUuid(tenantId: bigint, uuid: string): Promise<Branch | null> {
    const row = await prisma.branch.findFirst({
      where: { tenantId, uuid, deletedAt: null },
    });
    return row ? toBranchDomain(row) : null;
  }

  async listBranchesByCompany(tenantId: bigint, companyId: bigint): Promise<Branch[]> {
    const rows = await prisma.branch.findMany({
      where: { tenantId, companyId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toBranchDomain);
  }

  async updateBranch(
    tenantId: bigint,
    uuid: string,
    props: UpdateBranchProps,
    tx?: RepositoryTransaction,
  ): Promise<Branch> {
    const client = this.client(tx);
    const { count } = await client.branch.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: {
        branchCode: props.branchCode,
        branchName: props.branchName,
        addressLine1: props.addressLine1,
        addressLine2: props.addressLine2,
        city: props.city,
        region: props.region,
        postalCode: props.postalCode,
        countryCode: props.countryCode,
        timeZone: props.timeZone,
        updatedBy: props.updatedBy ?? undefined,
      },
    });
    if (count === 0) {
      throw new BranchNotFoundError(uuid);
    }
    const row = await client.branch.findFirst({ where: { tenantId, uuid } });
    return toBranchDomain(row as BranchModel);
  }

  // --- Department ---
  // Department is tenant-owned (MT-001) and belongs to exactly one Company
  // (DPT-001, independent of Branch per Ch.4.1) — every query below asserts
  // `tenantId` explicitly.

  async createDepartment(
    tenantId: bigint,
    companyId: bigint,
    props: CreateDepartmentProps,
    tx?: RepositoryTransaction,
  ): Promise<Department> {
    const row = await this.client(tx).department.create({
      data: {
        uuid: newUuid(),
        tenantId,
        companyId,
        departmentCode: props.departmentCode,
        departmentName: props.departmentName,
        createdBy: props.createdBy ?? null,
      },
    });
    return toDepartmentDomain(row);
  }

  async findDepartmentByUuid(tenantId: bigint, uuid: string): Promise<Department | null> {
    const row = await prisma.department.findFirst({
      where: { tenantId, uuid, deletedAt: null },
    });
    return row ? toDepartmentDomain(row) : null;
  }

  async listDepartmentsByCompany(tenantId: bigint, companyId: bigint): Promise<Department[]> {
    const rows = await prisma.department.findMany({
      where: { tenantId, companyId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toDepartmentDomain);
  }

  async updateDepartment(
    tenantId: bigint,
    uuid: string,
    props: UpdateDepartmentProps,
    tx?: RepositoryTransaction,
  ): Promise<Department> {
    const client = this.client(tx);
    const { count } = await client.department.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: {
        departmentCode: props.departmentCode,
        departmentName: props.departmentName,
        updatedBy: props.updatedBy ?? undefined,
      },
    });
    if (count === 0) {
      throw new DepartmentNotFoundError(uuid);
    }
    const row = await client.department.findFirst({ where: { tenantId, uuid } });
    return toDepartmentDomain(row as DepartmentModel);
  }
}
