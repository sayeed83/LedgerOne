import { z } from "zod";

// JSON has no bigint type, so tenantId travels as a decimal string on the
// wire and is transformed straight to bigint — matching the Business
// layer's `tenantId: bigint` input shape (Ch.16.5: DTO type inferred from
// its Zod schema).
export const tenantIdSchema = z
  .string()
  .regex(/^\d+$/, "tenantId must be a numeric string")
  .transform((value) => BigInt(value));
