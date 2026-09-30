import { z } from "zod";
import { CustomerStatus } from "@ledgerone/shared-types";

const uuidSchema = z.string().uuid("Select a valid option.");

// Mirrors the backend's create/update-customer.dto.ts field shapes/limits
// exactly (name VARCHAR(255), addressLine1/addressLine2 VARCHAR(255), city/
// region VARCHAR(120), postalCode VARCHAR(20), countryCode CHAR(2),
// paymentTerms VARCHAR(64) per sales.prisma) — no invented validation
// rules. `creditLimit` is validated only for non-empty shape, mirroring the
// backend's own shape-only check (no threshold/CUS-002 validation is
// duplicated client-side either).
export const customerFormSchema = z.object({
  companyUuid: uuidSchema,
  name: z.string().min(1, "Name is required.").max(255, "Name must be at most 255 characters."),
  addressLine1: z.string().max(255, "Address line 1 must be at most 255 characters.").optional(),
  addressLine2: z.string().max(255, "Address line 2 must be at most 255 characters.").optional(),
  city: z.string().max(120, "City must be at most 120 characters.").optional(),
  region: z.string().max(120, "Region must be at most 120 characters.").optional(),
  postalCode: z.string().max(20, "Postal code must be at most 20 characters.").optional(),
  countryCode: z
    .string()
    .length(2, "Country code must be a 2-letter ISO code.")
    .optional()
    .or(z.literal("")),
  creditLimit: z.string().min(1, "Credit limit is required.").optional(),
  paymentTerms: z.string().max(64, "Payment terms must be at most 64 characters.").optional(),
  status: z.nativeEnum(CustomerStatus, { errorMap: () => ({ message: "Select a status." }) }),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
