import { CompanyStatus } from "../enums/company-status.enum";
import { InvalidCompanyStatusTransitionError } from "../errors/organization.errors";

// Domain aggregate root for a Company (00_BUSINESS_RULES.md Ch.2) — the
// legal entity dimension within a Tenant, and the consistency boundary for
// Branch/Department (Ch.3-4), which reference it directly. The constructor
// stays public (rather than a validating static factory, Ch.15.5) because
// the Repository layer's `toDomain` mapping (05_CODING_STANDARDS.md Ch.14.6)
// must reconstruct this aggregate directly from an already-valid persisted
// row; the lifecycle invariants a caller can violate (Ch.15.4) are instead
// enforced by the transition methods below (Ch.15.6 — a transition returns
// a new instance rather than mutating in place), mirroring Tenant's own
// transition methods.
export class Company {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly companyCode: string,
    public readonly legalName: string,
    public readonly displayName: string | null,
    public readonly legalEntityType: string | null,
    public readonly taxRegistrationNumber: string,
    public readonly baseCurrencyCode: string,
    public readonly country: string,
    public readonly timeZone: string,
    public readonly financialYearStartMonth: number,
    public readonly financialYearStartDay: number,
    public readonly status: CompanyStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}

  /** Company lifecycle (00_BUSINESS_RULES.md Ch.2.6): Draft/Closed → Active (initial activation or reopening). */
  activate(): Company {
    if (this.status !== CompanyStatus.Draft && this.status !== CompanyStatus.Closed) {
      throw new InvalidCompanyStatusTransitionError(this.status, CompanyStatus.Active);
    }
    return this.withStatus(CompanyStatus.Active);
  }

  /** Company lifecycle (00_BUSINESS_RULES.md Ch.2.6): Active → Closed. */
  close(): Company {
    if (this.status !== CompanyStatus.Active) {
      throw new InvalidCompanyStatusTransitionError(this.status, CompanyStatus.Closed);
    }
    return this.withStatus(CompanyStatus.Closed);
  }

  private withStatus(status: CompanyStatus): Company {
    return new Company(
      this.id,
      this.uuid,
      this.tenantId,
      this.companyCode,
      this.legalName,
      this.displayName,
      this.legalEntityType,
      this.taxRegistrationNumber,
      this.baseCurrencyCode,
      this.country,
      this.timeZone,
      this.financialYearStartMonth,
      this.financialYearStartDay,
      status,
      this.createdAt,
      this.updatedAt,
      this.createdBy,
      this.updatedBy,
      this.deletedAt,
    );
  }
}

/** Fields required to persist a new Company row; identity/timestamps/status default are assigned by the database. */
export interface CreateCompanyProps {
  companyCode: string;
  legalName: string;
  displayName?: string | null;
  legalEntityType?: string | null;
  taxRegistrationNumber: string;
  baseCurrencyCode: string;
  country: string;
  timeZone: string;
  financialYearStartMonth: number;
  financialYearStartDay: number;
  createdBy?: bigint | null;
}

/** Fields a caller may revise on an existing Company row; status is changed only via `activateCompany`/`deactivateCompany`. */
export interface UpdateCompanyProps {
  companyCode?: string;
  legalName?: string;
  displayName?: string | null;
  legalEntityType?: string | null;
  taxRegistrationNumber?: string;
  baseCurrencyCode?: string;
  country?: string;
  timeZone?: string;
  financialYearStartMonth?: number;
  financialYearStartDay?: number;
  updatedBy?: bigint | null;
}
