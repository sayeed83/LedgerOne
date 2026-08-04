import { z } from "zod";

// No `X-Tenant-Id` header — Currency is platform-owned reference data
// (00_BUSINESS_RULES.md Ch.7.5, 06_DATABASE_STANDARDS.md MT-005), mirroring
// Authorization's Permission (list-permissions-query.dto.ts). `isoCode`'s
// "3 uppercase letters" shape is not literally spelled out in Ch.7 — it is
// inferred from the ISO 4217 convention Ch.7.1's examples (USD/EUR/INR) use
// plus the `currencies.iso_code VARCHAR(3)` column width
// (accounting.prisma) — flagged as a Handbook Deviation (format inferred,
// not explicitly mandated). `decimalPrecision`'s 0-255 bound matches the
// column's `UnsignedTinyInt` width, not an invented business rule.
export const createCurrencyRequestSchema = z.object({
  isoCode: z
    .string()
    .regex(/^[A-Z]{3}$/, "isoCode must be 3 uppercase letters (ISO 4217)"),
  name: z.string().min(1).max(100),
  symbol: z.string().min(1).max(10),
  decimalPrecision: z.number().int().min(0).max(255),
});

export type CreateCurrencyRequest = z.infer<typeof createCurrencyRequestSchema>;
