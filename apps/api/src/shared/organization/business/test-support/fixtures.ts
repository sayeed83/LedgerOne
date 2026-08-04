// Shared test fixtures/fakes for Business-layer unit tests
// (05_CODING_STANDARDS.md Ch.10.6 — a unit test constructs a fake `deps`
// object directly, no mocking framework/container required). Not a
// `.service.ts` file itself, so it carries no use-case naming suffix.
import { Tenant } from "../../domain/aggregates/tenant.aggregate";
import { TenantStatus } from "../../domain/enums/tenant-status.enum";
import { TenantSettings } from "../../domain/entities/tenant-settings.entity";
import { TenantSubscription } from "../../domain/entities/tenant-subscription.entity";
import { TenantSubscriptionStatus } from "../../domain/enums/tenant-subscription-status.enum";
import { Company } from "../../domain/aggregates/company.aggregate";
import { CompanyStatus } from "../../domain/enums/company-status.enum";
import { Branch } from "../../domain/entities/branch.entity";
import { BranchStatus } from "../../domain/enums/branch-status.enum";
import { Department } from "../../domain/entities/department.entity";
import { DepartmentStatus } from "../../domain/enums/department-status.enum";
import { IOrganizationRepository } from "../../domain/interfaces/organization-repository.interface";

export function buildTenant(overrides: Partial<Tenant> = {}): Tenant {
  const base = new Tenant(
    1n,
    "00000000-0000-0000-0000-000000000001",
    "Acme Trading Pvt. Ltd.",
    "admin@acme.example.com",
    TenantStatus.Provisioning,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(Tenant.prototype), base, overrides) as Tenant;
}

export function buildTenantSettings(overrides: Partial<TenantSettings> = {}): TenantSettings {
  const base = new TenantSettings(
    1n,
    "00000000-0000-0000-0000-000000000002",
    1n,
    "USD",
    "UTC",
    "APR-MAR",
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(TenantSettings.prototype), base, overrides) as TenantSettings;
}

export function buildTenantSubscription(overrides: Partial<TenantSubscription> = {}): TenantSubscription {
  const base = new TenantSubscription(
    1n,
    "00000000-0000-0000-0000-000000000003",
    1n,
    "STARTER",
    ["accounting"],
    TenantSubscriptionStatus.Provisioning,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-02-01T00:00:00.000Z"),
    null,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(TenantSubscription.prototype), base, overrides) as TenantSubscription;
}

export function buildCompany(overrides: Partial<Company> = {}): Company {
  const base = new Company(
    1n,
    "00000000-0000-0000-0000-000000000010",
    1n,
    "CO-001",
    "Acme Trading Pvt. Ltd.",
    "Acme Trading",
    "PRIVATE_LIMITED",
    "TAX-001",
    "USD",
    "US",
    "UTC",
    4,
    1,
    CompanyStatus.Draft,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(Company.prototype), base, overrides) as Company;
}

export function buildBranch(overrides: Partial<Branch> = {}): Branch {
  const base = new Branch(
    1n,
    "00000000-0000-0000-0000-000000000020",
    1n,
    1n,
    "BR-001",
    "Head Office",
    BranchStatus.Active,
    "123 Main St",
    null,
    "Metropolis",
    null,
    null,
    "US",
    "UTC",
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(Branch.prototype), base, overrides) as Branch;
}

export function buildDepartment(overrides: Partial<Department> = {}): Department {
  const base = new Department(
    1n,
    "00000000-0000-0000-0000-000000000030",
    1n,
    1n,
    "DPT-001",
    "Finance",
    DepartmentStatus.Active,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(Department.prototype), base, overrides) as Department;
}

export function createFakeOrganizationRepository(): jest.Mocked<IOrganizationRepository> {
  return {
    createTenant: jest.fn(),
    findTenantById: jest.fn(),
    findTenantByUuid: jest.fn(),
    findTenantsByStatus: jest.fn(),
    updateTenant: jest.fn(),
    updateTenantStatus: jest.fn(),
    getTenantSettings: jest.fn(),
    createTenantSettings: jest.fn(),
    updateTenantSettings: jest.fn(),
    getTenantSubscription: jest.fn(),
    createTenantSubscription: jest.fn(),
    updateTenantSubscription: jest.fn(),
    createCompany: jest.fn(),
    findCompanyByUuid: jest.fn(),
    updateCompany: jest.fn(),
    listCompaniesByTenant: jest.fn(),
    activateCompany: jest.fn(),
    deactivateCompany: jest.fn(),
    createBranch: jest.fn(),
    findBranchByUuid: jest.fn(),
    updateBranch: jest.fn(),
    listBranchesByCompany: jest.fn(),
    createDepartment: jest.fn(),
    findDepartmentByUuid: jest.fn(),
    updateDepartment: jest.fn(),
    listDepartmentsByCompany: jest.fn(),
  };
}
