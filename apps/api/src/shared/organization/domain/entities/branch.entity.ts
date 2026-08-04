import { BranchStatus } from "../enums/branch-status.enum";

// Domain entity for a Branch (00_BUSINESS_RULES.md Ch.3) — a physical/
// operational location belonging to exactly one Company (BRN-001), a child
// entity within the Company Aggregate (03_ARCHITECTURE.md Ch.7.3.3). Data
// shape only — see company.aggregate.ts for the same rationale.
export class Branch {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly companyId: bigint,
    public readonly branchCode: string,
    public readonly branchName: string,
    public readonly status: BranchStatus,
    public readonly addressLine1: string,
    public readonly addressLine2: string | null,
    public readonly city: string,
    public readonly region: string | null,
    public readonly postalCode: string | null,
    public readonly countryCode: string,
    public readonly timeZone: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}
}

/** Fields required to persist a new Branch row; identity/timestamps/status default are assigned by the database. */
export interface CreateBranchProps {
  branchCode: string;
  branchName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  region?: string | null;
  postalCode?: string | null;
  countryCode: string;
  timeZone: string;
  createdBy?: bigint | null;
}

/** Fields a caller may revise on an existing Branch row; status transitions are not part of this milestone. */
export interface UpdateBranchProps {
  branchCode?: string;
  branchName?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  region?: string | null;
  postalCode?: string | null;
  countryCode?: string;
  timeZone?: string;
  updatedBy?: bigint | null;
}
