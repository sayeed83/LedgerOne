import type { AccountType } from "./account-group.dto";

// Read-only derived data — no request DTOs beyond query filters, mirrors
// presentation/dto/responses/ledger.response.dto.ts.
export interface LedgerAccountSummaryDto {
  uuid: string;
  companyUuid: string;
  code: string;
  name: string;
  accountType: AccountType;
}

export interface LedgerEntryResponseDto {
  uuid: string;
  entryDate: string;
  debitAmount: string;
  creditAmount: string;
  runningBalance: string;
}

export interface AccountLedgerResponseDto {
  account: LedgerAccountSummaryDto;
  openingBalance: string;
  closingBalance: string;
  entries: LedgerEntryResponseDto[];
}

export interface LedgerEntryJournalSummaryDto {
  uuid: string;
  postingDate: string;
  narration: string | null;
  status: string;
}

export interface LedgerEntryDetailResponseDto {
  uuid: string;
  entryDate: string;
  debitAmount: string;
  creditAmount: string;
  journalEntry: LedgerEntryJournalSummaryDto;
}

export interface ListLedgerQueryDto {
  accountUuid?: string;
  companyUuid?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  pageSize?: number;
}

export interface CursorPaginationMetaDto {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface AccountLedgerEnvelopeDto {
  data: AccountLedgerResponseDto;
  meta: { pagination: CursorPaginationMetaDto };
}
