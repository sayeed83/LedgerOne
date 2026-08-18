// Mirrors apps/api/src/shared/accounting/domain/enums/fiscal-period-status.enum.ts.
export enum FiscalPeriodStatus {
  Open = "OPEN",
  SoftClosed = "SOFT_CLOSED",
  Closed = "CLOSED",
  Reopened = "REOPENED",
}

// Mirrors presentation/dto/responses/fiscal-period.response.dto.ts. The
// backend does not expose `financialYearUuid` on this shape (flagged known
// gap) — screens must keep the parent Financial Year's uuid in the route
// rather than reading it off the entity itself.
export interface FiscalPeriodResponseDto {
  uuid: string;
  companyUuid: string;
  startDate: string;
  endDate: string;
  status: FiscalPeriodStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFiscalPeriodRequestDto {
  financialYearUuid: string;
  startDate: string;
  endDate: string;
}

export interface UpdateFiscalPeriodRequestDto {
  startDate?: string;
  endDate?: string;
}
