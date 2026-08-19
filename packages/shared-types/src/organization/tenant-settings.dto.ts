// Mirrors presentation/dto/responses/tenant-settings.response.dto.ts.
export interface TenantSettingsResponseDto {
  uuid: string;
  defaultCurrencyCode: string;
  defaultTimeZone: string;
  defaultFinancialYearPattern: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTenantSettingsRequestDto {
  defaultCurrencyCode?: string;
  defaultTimeZone?: string;
  defaultFinancialYearPattern?: string;
}

// Unlike UpdateTenantSettingsRequestDto, every field is required — there is
// no documented default to fall back to at provisioning time
// (00_BUSINESS_RULES.md Ch.1.7/ORG-003).
export interface CreateTenantSettingsRequestDto {
  defaultCurrencyCode: string;
  defaultTimeZone: string;
  defaultFinancialYearPattern: string;
}
