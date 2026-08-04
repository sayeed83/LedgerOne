import { z } from "zod";

// `taxGroupUuid` is an optional query filter narrowing the tenant-wide list
// to one Tax Group, mirroring list-exchange-rates-query.dto.ts's optional-
// filter shape.
export const listTaxRulesQuerySchema = z.object({
  taxGroupUuid: z.string().uuid().optional(),
});

export type ListTaxRulesQuery = z.infer<typeof listTaxRulesQuerySchema>;
