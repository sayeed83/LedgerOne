// Mirrors apps/api/src/shared/organization/domain/enums/branch-status.enum.ts.
export enum BranchStatus {
  Active = "ACTIVE",
  Inactive = "INACTIVE",
}

// Mirrors presentation/dto/responses/branch.response.dto.ts.
export interface BranchResponseDto {
  uuid: string;
  branchCode: string;
  branchName: string;
  status: BranchStatus;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string | null;
  postalCode: string | null;
  countryCode: string;
  timeZone: string;
  createdAt: string;
  updatedAt: string;
}

// `companyUuid` identifies the parent Company and must be supplied in the
// body (the route carries no segment for it), mirroring create-branch.dto.ts.
export interface CreateBranchRequestDto {
  companyUuid: string;
  branchCode: string;
  branchName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  region?: string | null;
  postalCode?: string | null;
  countryCode: string;
  timeZone: string;
}

// No status transitions in this milestone (mirrors update-branch.dto.ts).
export interface UpdateBranchRequestDto {
  branchCode?: string;
  branchName?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  region?: string | null;
  postalCode?: string | null;
  countryCode?: string;
  timeZone?: string;
}
