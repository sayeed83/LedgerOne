// Mirrors apps/api/src/shared/accounting/domain/enums/journal-entry-status.enum.ts.
export enum JournalEntryStatus {
  Draft = "DRAFT",
  PendingApproval = "PENDING_APPROVAL",
  Posted = "POSTED",
  Reversed = "REVERSED",
}

// Mirrors presentation/dto/responses/journal-entry.response.dto.ts. Flagged
// known backend gap: a line's `accountUuid` is not echoed back on read — the
// response only carries the line's own uuid and amounts, so a screen cannot
// tell which Account a persisted line posted against from this shape alone.
export interface JournalEntryLineResponseDto {
  uuid: string;
  debitAmount: string;
  creditAmount: string;
}

export interface JournalEntryResponseDto {
  uuid: string;
  companyUuid: string;
  postingDate: string;
  narration: string | null;
  status: JournalEntryStatus;
  lines: JournalEntryLineResponseDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateJournalEntryLineRequestDto {
  accountUuid: string;
  debitAmount: string;
  creditAmount: string;
}

export interface CreateJournalEntryRequestDto {
  companyUuid: string;
  postingDate: string;
  narration?: string;
  lines: CreateJournalEntryLineRequestDto[];
}

export interface UpdateJournalEntryRequestDto {
  postingDate?: string;
  narration?: string | null;
}

export interface ListJournalEntriesQueryDto {
  companyUuid?: string;
  status?: JournalEntryStatus;
}
