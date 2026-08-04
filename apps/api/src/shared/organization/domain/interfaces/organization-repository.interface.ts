// Repository interface, owned by the Domain layer per 03_ARCHITECTURE.md
// Decision 5.7.2 — the Repository layer provides the implementation, never
// the contract. Every method is persistence-only (05_CODING_STANDARDS.md
// Ch.14.4): no lifecycle-transition rules (ORG-001/002/005), no module
// entitlement checks (ORG-004) — those are Business-layer concerns that call
// these methods. Find methods return `null`, never throw, when nothing
// matches (05_CODING_STANDARDS.md Ch.8.5/Ch.14).
//
// Tenant scoping (06_DATABASE_STANDARDS.md Ch.6, 05_CODING_STANDARDS.md
// Ch.14.5) applies to tenant-owned tables. `tenants` itself carries no
// `tenant_id` — it IS the tenant registry, a platform-owned table (MT-005) —
// so its methods are keyed by its own `id`/`uuid`/`status` and are
// necessarily cross-tenant by nature, not a violation of Ch.14.5's rule.
// `TenantSettings`/`TenantSubscription` are genuinely tenant-owned child
// records and are always keyed by `tenantId`.
//
// Company/Branch/Department are also genuinely tenant-owned (MT-001, no
// convenience exceptions even though each is reachable via its parent) —
// every lookup/mutation below takes `tenantId` explicitly and re-asserts it
// in its own query, never relying on a previously-resolved row's identity
// (MT-002, Ch.6.4's worked example: "the database layer does not trust the
// call site's memory of context"). Company/Branch/Department status is
// changed only via `activateCompany`/`deactivateCompany` for Company;
// Branch/Department status transitions are not part of this milestone.
import { Tenant, CreateTenantProps, UpdateTenantProps } from "../aggregates/tenant.aggregate";
import { Company, CreateCompanyProps, UpdateCompanyProps } from "../aggregates/company.aggregate";
import { TenantStatus } from "../enums/tenant-status.enum";
import {
  TenantSettings,
  CreateTenantSettingsProps,
  UpdateTenantSettingsProps,
} from "../entities/tenant-settings.entity";
import {
  TenantSubscription,
  CreateTenantSubscriptionProps,
  UpdateTenantSubscriptionProps,
} from "../entities/tenant-subscription.entity";
import { Branch, CreateBranchProps, UpdateBranchProps } from "../entities/branch.entity";
import { Department, CreateDepartmentProps, UpdateDepartmentProps } from "../entities/department.entity";

/**
 * Opaque handle for an in-flight transaction, supplied by the Business
 * layer's `$transaction` callback (03_ARCHITECTURE.md Decision 5.7.3 —
 * transactions are opened only at the Business layer) and passed through
 * unmodified. Kept as `unknown` rather than a Prisma-specific type so this
 * Domain-owned interface stays free of ORM types (Ch.5.3.4); the Repository
 * implementation casts it back to Prisma's transaction client internally.
 */
export type RepositoryTransaction = unknown;

export interface IOrganizationRepository {
  // --- Tenant ---
  createTenant(props: CreateTenantProps, tx?: RepositoryTransaction): Promise<Tenant>;
  findTenantById(id: bigint): Promise<Tenant | null>;
  findTenantByUuid(uuid: string): Promise<Tenant | null>;
  /** Platform-level, cross-tenant by nature (see file header) — reserved for admin tooling per Ch.14.5's named-exception rule. */
  findTenantsByStatus(status: TenantStatus): Promise<Tenant[]>;
  updateTenant(id: bigint, props: UpdateTenantProps, tx?: RepositoryTransaction): Promise<Tenant>;
  updateTenantStatus(id: bigint, status: TenantStatus, updatedBy?: bigint | null, tx?: RepositoryTransaction): Promise<Tenant>;

  // --- Tenant settings ---
  getTenantSettings(tenantId: bigint): Promise<TenantSettings | null>;
  createTenantSettings(tenantId: bigint, props: CreateTenantSettingsProps, tx?: RepositoryTransaction): Promise<TenantSettings>;
  updateTenantSettings(tenantId: bigint, props: UpdateTenantSettingsProps, tx?: RepositoryTransaction): Promise<TenantSettings>;

  // --- Tenant subscription ---
  getTenantSubscription(tenantId: bigint): Promise<TenantSubscription | null>;
  createTenantSubscription(tenantId: bigint, props: CreateTenantSubscriptionProps, tx?: RepositoryTransaction): Promise<TenantSubscription>;
  updateTenantSubscription(tenantId: bigint, props: UpdateTenantSubscriptionProps, tx?: RepositoryTransaction): Promise<TenantSubscription>;

  // --- Company ---
  createCompany(tenantId: bigint, props: CreateCompanyProps, tx?: RepositoryTransaction): Promise<Company>;
  findCompanyByUuid(tenantId: bigint, uuid: string): Promise<Company | null>;
  updateCompany(tenantId: bigint, uuid: string, props: UpdateCompanyProps, tx?: RepositoryTransaction): Promise<Company>;
  listCompaniesByTenant(tenantId: bigint): Promise<Company[]>;
  /** Sets status to Active (00_BUSINESS_RULES.md Ch.2.6) — a raw persistence transition; validating the `from` state is a Business-layer concern (this milestone is Repository-only). */
  activateCompany(tenantId: bigint, uuid: string, updatedBy?: bigint | null, tx?: RepositoryTransaction): Promise<Company>;
  /** Sets status to Closed (00_BUSINESS_RULES.md Ch.2.6) — a raw persistence transition; validating the `from` state is a Business-layer concern (this milestone is Repository-only). */
  deactivateCompany(tenantId: bigint, uuid: string, updatedBy?: bigint | null, tx?: RepositoryTransaction): Promise<Company>;

  // --- Branch ---
  createBranch(tenantId: bigint, companyId: bigint, props: CreateBranchProps, tx?: RepositoryTransaction): Promise<Branch>;
  findBranchByUuid(tenantId: bigint, uuid: string): Promise<Branch | null>;
  updateBranch(tenantId: bigint, uuid: string, props: UpdateBranchProps, tx?: RepositoryTransaction): Promise<Branch>;
  listBranchesByCompany(tenantId: bigint, companyId: bigint): Promise<Branch[]>;

  // --- Department ---
  createDepartment(tenantId: bigint, companyId: bigint, props: CreateDepartmentProps, tx?: RepositoryTransaction): Promise<Department>;
  findDepartmentByUuid(tenantId: bigint, uuid: string): Promise<Department | null>;
  updateDepartment(tenantId: bigint, uuid: string, props: UpdateDepartmentProps, tx?: RepositoryTransaction): Promise<Department>;
  listDepartmentsByCompany(tenantId: bigint, companyId: bigint): Promise<Department[]>;
}
