// Mirrors apps/api/src/shared/organization/domain/enums/company-status.enum.ts.
export enum CompanyStatus {
  Draft = "DRAFT",
  Active = "ACTIVE",
  Closed = "CLOSED",
  Dissolved = "DISSOLVED",
}

// Mirrors presentation/dto/responses/company.response.dto.ts.
export interface CompanyResponseDto {
  uuid: string;
  companyCode: string;
  legalName: string;
  displayName: string | null;
  legalEntityType: string | null;
  taxRegistrationNumber: string;
  baseCurrencyCode: string;
  country: string;
  timeZone: string;
  financialYearStartMonth: number;
  financialYearStartDay: number;
  status: CompanyStatus;
  createdAt: string;
  updatedAt: string;
}

// `tenantUuid` is not part of this shape — it travels via the `X-Tenant-Id`
// header (tenant context, not company-specific data), mirroring the
// backend's create-company.dto.ts exactly.
export interface CreateCompanyRequestDto {
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
}

export interface UpdateCompanyRequestDto {
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
}
