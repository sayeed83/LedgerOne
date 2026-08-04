// Repository interface, owned by the Domain layer per 03_ARCHITECTURE.md
// Decision 5.7.2 — the Repository layer provides the implementation, never
// the contract. Every method is persistence-only (05_CODING_STANDARDS.md
// Ch.14.4): no lifecycle-transition rules (Ch.10.5/USR-002/USR-004), no
// Role/Permission checks (Authorization module) — those are Business-layer
// concerns that call these methods. Find methods return `null`, never
// throw, when nothing matches (05_CODING_STANDARDS.md Ch.8.5/Ch.14).
//
// User is tenant-owned (06_DATABASE_STANDARDS.md MT-001, no convenience
// exceptions) — every method below takes `tenantId` explicitly and
// re-asserts it in its own query, never relying on a previously-resolved
// row's identity (MT-002, 06_DATABASE_STANDARDS.md Ch.6.4's worked example).
// `companyUuid`/`branchUuid`/`departmentUuid` are cross-module references
// into Organization (FK-002) and are looked up/filtered by `uuid`, never a
// numeric id from another module's schema. Status is changed only via
// `activateUser`/`suspendUser`/`deactivateUser`.
import { User, CreateUserProps, UpdateUserProps } from "../aggregates/user.aggregate";
import { UserStatus } from "../enums/user-status.enum";

/**
 * Opaque handle for an in-flight transaction, supplied by the Business
 * layer's `$transaction` callback (03_ARCHITECTURE.md Decision 5.7.3 —
 * transactions are opened only at the Business layer) and passed through
 * unmodified. Kept as `unknown` rather than a Prisma-specific type so this
 * Domain-owned interface stays free of ORM types (Ch.5.3.4); the Repository
 * implementation casts it back to Prisma's transaction client internally.
 */
export type RepositoryTransaction = unknown;

export interface IUserManagementRepository {
  createUser(tenantId: bigint, props: CreateUserProps, tx?: RepositoryTransaction): Promise<User>;
  findUserByUuid(tenantId: bigint, uuid: string): Promise<User | null>;
  findUserByEmail(tenantId: bigint, email: string): Promise<User | null>;
  findUsersByStatus(tenantId: bigint, status: UserStatus): Promise<User[]>;
  updateUser(tenantId: bigint, uuid: string, props: UpdateUserProps, tx?: RepositoryTransaction): Promise<User>;
  /** Sets status to Active (00_BUSINESS_RULES.md Ch.10.5) — a raw persistence transition; validating the `from` state is a Business-layer concern (this milestone is Repository-only). */
  activateUser(tenantId: bigint, uuid: string, updatedBy?: bigint | null, tx?: RepositoryTransaction): Promise<User>;
  /** Sets status to Suspended (00_BUSINESS_RULES.md Ch.10.5) — a raw persistence transition; validating the `from` state is a Business-layer concern (this milestone is Repository-only). */
  suspendUser(tenantId: bigint, uuid: string, updatedBy?: bigint | null, tx?: RepositoryTransaction): Promise<User>;
  /** Sets status to Deactivated (00_BUSINESS_RULES.md Ch.10.5) — a raw persistence transition; validating the `from` state is a Business-layer concern (this milestone is Repository-only). */
  deactivateUser(tenantId: bigint, uuid: string, updatedBy?: bigint | null, tx?: RepositoryTransaction): Promise<User>;
  listUsersByTenant(tenantId: bigint): Promise<User[]>;
  listUsersByCompany(tenantId: bigint, companyUuid: string): Promise<User[]>;
  /** Case-insensitive substring match against name and email fields (collation-driven, 06_DATABASE_STANDARDS.md Ch.2) — no ranking/relevance scoring, a Business/Presentation-layer concern if ever needed. */
  searchUsers(tenantId: bigint, query: string): Promise<User[]>;
}
