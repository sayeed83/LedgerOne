import { z } from "zod";
import { AccountType, AccountStatus } from "../../../business/accounting-types";

// Never the `Account` Domain aggregate itself (05_CODING_STANDARDS.md
// Ch.16.3) — a separate, flatter shape. Internal `id`/`tenantId`/
// `createdBy`/`updatedBy`/`deletedAt` are never serialized
// (06_DATABASE_STANDARDS.md PK-003) — that includes `accountGroupId`/
// `parentAccountId`, this aggregate's own internal in-module FKs, which are
// DELIBERATELY OMITTED here rather than resolved to their respective
// `uuid`s — the identical carried-forward Handbook Deviation already
// documented in account-group.response.dto.ts (itself mirroring Tax Rule's
// `taxGroupId` omission), not a new one introduced here.
export const accountResponseSchema = z.object({
  uuid: z.string().uuid(),
  companyUuid: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  accountType: z.nativeEnum(AccountType),
  isPostingAccount: z.boolean(),
  status: z.nativeEnum(AccountStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AccountResponse = z.infer<typeof accountResponseSchema>;

/** Structural rather than importing the Domain `Account` type (Presentation must not import domain/, Ch.9.3). */
interface AccountLike {
  uuid: string;
  companyUuid: string;
  code: string;
  name: string;
  accountType: AccountType;
  isPostingAccount: boolean;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function toAccountResponse(account: AccountLike): AccountResponse {
  return {
    uuid: account.uuid,
    companyUuid: account.companyUuid,
    code: account.code,
    name: account.name,
    accountType: account.accountType,
    isPostingAccount: account.isPostingAccount,
    status: account.status,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}
