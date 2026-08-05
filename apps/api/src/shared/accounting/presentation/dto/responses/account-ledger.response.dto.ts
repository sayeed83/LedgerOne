import { z } from "zod";
import { AccountType } from "../../../business/accounting-types";
import { ledgerEntryResponseSchema, toLedgerEntryResponse } from "./ledger-entry.response.dto";

// The General Ledger read model's per-account view response
// (00_BUSINESS_RULES.md Ch.19.1). `account` is a deliberately narrow subset
// of account.response.dto.ts's own shape (uuid/companyUuid/code/name/
// accountType only) — just enough to label the Ledger being viewed, not a
// full Account resource duplication. Internal `id`/`tenantId` never
// serialized (PK-003).
export const accountLedgerResponseSchema = z.object({
  account: z.object({
    uuid: z.string().uuid(),
    companyUuid: z.string().uuid(),
    code: z.string(),
    name: z.string(),
    accountType: z.nativeEnum(AccountType),
  }),
  openingBalance: z.string(),
  closingBalance: z.string(),
  entries: z.array(ledgerEntryResponseSchema),
});

export type AccountLedgerResponse = z.infer<typeof accountLedgerResponseSchema>;

/** The pagination `meta` block accompanying this response, per 07_REST_API_STANDARDS.md Ch.14.3's literal documented envelope shape (`meta.pagination`) — kept as a sibling of `data`, not nested inside it. */
export const ledgerPaginationMetaSchema = z.object({
  pagination: z.object({
    limit: z.number(),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});

export type LedgerPaginationMeta = z.infer<typeof ledgerPaginationMetaSchema>;

interface AccountLedgerResultLike {
  account: {
    uuid: string;
    companyUuid: string;
    code: string;
    name: string;
    accountType: AccountType;
  };
  openingBalance: { toString(): string };
  closingBalance: { toString(): string };
  entries: Parameters<typeof toLedgerEntryResponse>[0][];
  pagination: { limit: number; nextCursor: string | null; hasMore: boolean };
}

export function toAccountLedgerResponse(result: AccountLedgerResultLike): AccountLedgerResponse {
  return {
    account: {
      uuid: result.account.uuid,
      companyUuid: result.account.companyUuid,
      code: result.account.code,
      name: result.account.name,
      accountType: result.account.accountType,
    },
    openingBalance: result.openingBalance.toString(),
    closingBalance: result.closingBalance.toString(),
    entries: result.entries.map(toLedgerEntryResponse),
  };
}

export function toLedgerPaginationMeta(result: AccountLedgerResultLike): LedgerPaginationMeta {
  return { pagination: result.pagination };
}
