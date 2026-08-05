import { z } from "zod";
import { AccountType } from "../../../business/accounting-types";

// Never the `AccountGroup` Domain entity itself (05_CODING_STANDARDS.md
// Ch.16.3) — a separate, flatter shape. Internal `id`/`tenantId`/
// `createdBy`/`updatedBy`/`deletedAt` are never serialized
// (06_DATABASE_STANDARDS.md PK-003) — only `uuid` (and the cross-module
// `companyUuid` reference) crosses the API boundary. `parentAccountGroupId`
// is DELIBERATELY OMITTED entirely rather than resolved to its parent's
// `uuid` — mirroring Tax Rule's own documented choice to omit `taxGroupId`
// rather than pay an extra lookup per row (tax-rule.response.dto.ts's own
// comment, itself carried forward from Exchange Rate's
// `fromCurrencyId`/`toCurrencyId` omission) — a carried-forward Handbook
// Deviation/known gap, not a new one introduced here.
export const accountGroupResponseSchema = z.object({
  uuid: z.string().uuid(),
  companyUuid: z.string().uuid(),
  name: z.string(),
  accountType: z.nativeEnum(AccountType),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AccountGroupResponse = z.infer<typeof accountGroupResponseSchema>;

/** Structural rather than importing the Domain `AccountGroup` type (Presentation must not import domain/, Ch.9.3). */
interface AccountGroupLike {
  uuid: string;
  companyUuid: string;
  name: string;
  accountType: AccountType;
  createdAt: Date;
  updatedAt: Date;
}

export function toAccountGroupResponse(accountGroup: AccountGroupLike): AccountGroupResponse {
  return {
    uuid: accountGroup.uuid,
    companyUuid: accountGroup.companyUuid,
    name: accountGroup.name,
    accountType: accountGroup.accountType,
    createdAt: accountGroup.createdAt,
    updatedAt: accountGroup.updatedAt,
  };
}
