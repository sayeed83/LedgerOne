// Mirrors apps/api/src/shared/organization/domain/enums/tenant-status.enum.ts
// exactly (05_CODING_STANDARDS.md Ch.26.4) — never redeclared field-by-field
// independently (FLD-003/VAL-002).
export enum TenantStatus {
  Provisioning = "PROVISIONING",
  Active = "ACTIVE",
  Suspended = "SUSPENDED",
  Deactivated = "DEACTIVATED",
}

// Mirrors presentation/dto/responses/tenant.response.dto.ts's wire shape —
// dates arrive as ISO strings over JSON, never a `Date` instance.
export interface TenantResponseDto {
  uuid: string;
  legalName: string;
  primaryContactEmail: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantRequestDto {
  legalName: string;
  primaryContactEmail: string;
}

export interface UpdateTenantRequestDto {
  legalName?: string;
  primaryContactEmail?: string;
}
