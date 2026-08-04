import { AccountType } from "../enums/account-type.enum";

// Domain entity for an Account Group (00_BUSINESS_RULES.md Ch.18) — a
// classification category organizing Accounts (Ch.17) into reporting
// groupings (e.g. "Current Assets"). Tenant-owned (06_DATABASE_STANDARDS.md
// MT-001), carrying `companyUuid` directly (cross-module reference,
// FK-002, no DB-level FK), mirroring Tax Group's own ownership shape. Data
// shape only — no lifecycle transition methods, since Ch.18.5 documents
// Account Group as "largely static... platform-provided standard
// groupings" with no state machine, mirroring Tax Group's own entity
// (not aggregate) placement. Supports revision (name, type, parent) via
// the Repository's update method, mirroring Tax Group's own update support.
export class AccountGroup {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly companyUuid: string,
    public readonly name: string,
    public readonly accountType: AccountType,
    public readonly parentAccountGroupId: bigint | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}
}

/** Fields required to persist a new Account Group row; identity/timestamps are assigned by the database. */
export interface CreateAccountGroupProps {
  companyUuid: string;
  name: string;
  accountType: AccountType;
  parentAccountGroupId?: bigint | null;
  createdBy?: bigint | null;
}

/** Fields a caller may revise on an existing Account Group row. */
export interface UpdateAccountGroupProps {
  name?: string;
  accountType?: AccountType;
  parentAccountGroupId?: bigint | null;
  updatedBy?: bigint | null;
}
