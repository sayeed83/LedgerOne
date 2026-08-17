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
