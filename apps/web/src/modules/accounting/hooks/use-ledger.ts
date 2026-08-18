import { useQuery } from "@tanstack/react-query";
import type { LedgerEntryDetailResponseDto, ListLedgerQueryDto } from "@ledgerone/shared-types";
import * as accountingService from "@/services/accounting.service";
import type { AccountLedgerResult } from "@/services/accounting.service";
import type { ApiError } from "@/services/api-client";

export function accountLedgerQueryKey(accountUuid: string, query?: Omit<ListLedgerQueryDto, "accountUuid">) {
  return ["accounting", "ledger", "account", accountUuid, query ?? {}] as const;
}

// Read-only, cursor-paginated (TQ-005: staleTime kept short since Ledger
// reflects posted Journal Entries that can change frequently during active
// bookkeeping).
export function useAccountLedger(
  accountUuid: string | null,
  query?: Omit<ListLedgerQueryDto, "accountUuid">,
) {
  return useQuery<AccountLedgerResult, ApiError>({
    queryKey: accountLedgerQueryKey(accountUuid ?? "", query),
    queryFn: () => accountingService.getAccountLedger(accountUuid as string, query),
    enabled: Boolean(accountUuid),
  });
}

export function ledgerEntryQueryKey(ledgerEntryUuid: string) {
  return ["accounting", "ledger", "entry", ledgerEntryUuid] as const;
}

export function useLedgerEntry(ledgerEntryUuid: string | null) {
  return useQuery<LedgerEntryDetailResponseDto, ApiError>({
    queryKey: ledgerEntryQueryKey(ledgerEntryUuid ?? ""),
    queryFn: () => accountingService.getLedgerEntry(ledgerEntryUuid as string),
    enabled: Boolean(ledgerEntryUuid),
  });
}
