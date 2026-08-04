import { DepartmentStatus } from "../enums/department-status.enum";

// Domain entity for a Department (00_BUSINESS_RULES.md Ch.4) — a
// functional/organizational grouping belonging to exactly one Company
// (DPT-001, independent of Branch per Ch.4.1), a child entity within the
// Company Aggregate (03_ARCHITECTURE.md Ch.7.3.3). Data shape only — see
// company.aggregate.ts for the same rationale.
export class Department {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly companyId: bigint,
    public readonly departmentCode: string,
    public readonly departmentName: string,
    public readonly status: DepartmentStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}
}

/** Fields required to persist a new Department row; identity/timestamps/status default are assigned by the database. */
export interface CreateDepartmentProps {
  departmentCode: string;
  departmentName: string;
  createdBy?: bigint | null;
}

/** Fields a caller may revise on an existing Department row; status transitions are not part of this milestone. */
export interface UpdateDepartmentProps {
  departmentCode?: string;
  departmentName?: string;
  updatedBy?: bigint | null;
}
