// Mirrors apps/api/src/shared/accounting/domain/enums/financial-year-status.enum.ts.
export enum FinancialYearStatus {
  Future = "FUTURE",
  Open = "OPEN",
  Closing = "CLOSING",
  Closed = "CLOSED",
  Reopened = "REOPENED",
}

// Mirrors presentation/dto/responses/financial-year.response.dto.ts.
export interface FinancialYearResponseDto {
  uuid: string;
  companyUuid: string;
  startDate: string;
  endDate: string;
  status: FinancialYearStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFinancialYearRequestDto {
  companyUuid: string;
  startDate: string;
  endDate: string;
}

export interface UpdateFinancialYearRequestDto {
  startDate?: string;
  endDate?: string;
}
