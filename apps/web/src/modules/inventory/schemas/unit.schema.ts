import { z } from "zod";
import { uuidSchema } from "./shared.schema";

// `conversionFactor` reuses the exact Business-layer rule
// (apps/api/src/shared/inventory/business/create-unit.service.ts's
// `isPositiveDecimalString` — 00_BUSINESS_RULES.md Ch.36.8: "Conversion
// factor must be a positive number") rather than inventing a separate
// client-side rule — same regex, same zero/negative rejection.
const conversionFactorSchema = z
  .string()
  .optional()
  .refine((value) => !value || /^\d+(\.\d+)?$/.test(value), {
    message: "Enter a valid positive number.",
  })
  .refine((value) => !value || !/^0(\.0+)?$/.test(value), {
    message: "Conversion factor must be greater than zero.",
  });

export const unitFormSchema = z.object({
  companyUuid: uuidSchema,
  name: z.string().min(1, "Name is required.").max(100, "Name must be at most 100 characters."),
  symbol: z.string().min(1, "Symbol is required.").max(20, "Symbol must be at most 20 characters."),
  baseUnitUuid: z.string().optional(),
  conversionFactor: conversionFactorSchema,
});

export type UnitFormValues = z.infer<typeof unitFormSchema>;
