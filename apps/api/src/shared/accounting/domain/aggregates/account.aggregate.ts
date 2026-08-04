import { AccountType } from "../enums/account-type.enum";
import { AccountStatus } from "../enums/account-status.enum";
import { InvalidAccountStatusTransitionError } from "../errors/accounting.errors";

// Domain aggregate root for an Account (00_BUSINESS_RULES.md Ch.17) — an
// individual financial account within a Company's Chart of Accounts. The
// constructor stays public (rather than a validating static factory,
// Ch.15.5) because the Repository layer's `toDomain` mapping must
// reconstruct this aggregate directly from an already-valid persisted row;
// the lifecycle invariant a caller can violate is instead enforced by the
// transition methods below, mirroring FinancialYear's/Currency's own
// aggregates. `isPostingAccount` (frozen architectural decision — see
// accounting.prisma's `Account` model doc comment) and `accountType`'s
// COA-001 immutable-once-posted rule and COA-003's deactivation-blocked-
// while-non-zero-balance rule are explicitly NOT enforced here — both
// require Ledger/Journal Entry data this milestone does not have; a future
// Journal Entries module's Business layer is where those checks belong.
export class Account {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly companyUuid: string,
    public readonly code: string,
    public readonly name: string,
    public readonly accountType: AccountType,
    public readonly accountGroupId: bigint,
    public readonly parentAccountId: bigint | null,
    public readonly isPostingAccount: boolean,
    public readonly status: AccountStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}

  /** Account lifecycle (00_BUSINESS_RULES.md Ch.17.5): Draft/Inactive → Active — approved, available for posting. */
  activate(): Account {
    if (this.status !== AccountStatus.Draft && this.status !== AccountStatus.Inactive) {
      throw new InvalidAccountStatusTransitionError(this.status, AccountStatus.Active);
    }
    return this.withStatus(AccountStatus.Active);
  }

  /** Account lifecycle (00_BUSINESS_RULES.md Ch.17.5): Active → Inactive — no longer used for new postings, historical data retained. */
  deactivate(): Account {
    if (this.status !== AccountStatus.Active) {
      throw new InvalidAccountStatusTransitionError(this.status, AccountStatus.Inactive);
    }
    return this.withStatus(AccountStatus.Inactive);
  }

  private withStatus(status: AccountStatus): Account {
    return new Account(
      this.id,
      this.uuid,
      this.tenantId,
      this.companyUuid,
      this.code,
      this.name,
      this.accountType,
      this.accountGroupId,
      this.parentAccountId,
      this.isPostingAccount,
      status,
      this.createdAt,
      this.updatedAt,
      this.createdBy,
      this.updatedBy,
      this.deletedAt,
    );
  }
}

/** Fields required to persist a new Account row; identity/timestamps/status default are assigned by the database. */
export interface CreateAccountProps {
  companyUuid: string;
  code: string;
  name: string;
  accountType: AccountType;
  accountGroupId: bigint;
  parentAccountId?: bigint | null;
  isPostingAccount?: boolean;
  createdBy?: bigint | null;
}

/** Fields a caller may revise on an existing Account row; status is changed only via `activateAccount`/`deactivateAccount`. `code`/`accountType` are never revised here — Ch.17.7 COA-004 makes `code` a never-reused identity, and COA-001 makes `accountType` immutable once posted (a future Business-layer check); this Repository-layer shape simply never exposes either as revisable. */
export interface UpdateAccountProps {
  name?: string;
  accountGroupId?: bigint;
  parentAccountId?: bigint | null;
  isPostingAccount?: boolean;
  updatedBy?: bigint | null;
}
