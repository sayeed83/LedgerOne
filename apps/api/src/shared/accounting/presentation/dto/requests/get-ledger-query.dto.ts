import { z } from "zod";
import { ledgerQueryFiltersSchema } from "./ledger-query-filters.dto";

// `GET /ledger` query shape — identical to `ledgerQueryFiltersSchema` plus a
// required `accountUuid`. Per 00_BUSINESS_RULES.md Ch.19.1, a Ledger is
// inherently a per-account concept — there is no handbook notion of a
// cross-account commingled raw entry feed — so `GET /ledger` and
// `GET /ledger/accounts/:accountUuid` are the SAME operation, differing only
// in whether `accountUuid` arrives via query or path (see
// get-ledger.controller.ts's own doc comment).
export const getLedgerQuerySchema = ledgerQueryFiltersSchema.extend({
  accountUuid: z.string().uuid(),
});

export type GetLedgerQuery = z.infer<typeof getLedgerQuerySchema>;
