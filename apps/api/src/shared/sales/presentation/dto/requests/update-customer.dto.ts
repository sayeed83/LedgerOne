import { z } from "zod";
import { CustomerStatus } from "../../../business/sales-types";

// `addressLine1`/`addressLine2`/`city`/`region`/`postalCode`/`countryCode`/
// `paymentTerms` are `nullable().optional()` — the same documented, minimal
// choice update-product.dto.ts made for `description`: distinguishes "omit
// the field, leave the existing value untouched" (`undefined`) from
// "explicitly clear it" (`null`), matching the Business layer's own
// `update-customer.service.ts` input contract exactly. `companyUuid` has no
// field here at all — Ch.45 documents no Customer-reassigned-to-a-different-
// Company workflow, mirroring `UpdateCustomerInput`'s own omission.
// `status`/`creditLimit` are accepted with no transition/threshold
// validation, for the same reason create-customer.dto.ts's own fields carry
// none (CUS-002/Ch.45.5 deferred).
export const updateCustomerRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  addressLine1: z.string().min(1).max(255).nullable().optional(),
  addressLine2: z.string().min(1).max(255).nullable().optional(),
  city: z.string().min(1).max(120).nullable().optional(),
  region: z.string().min(1).max(120).nullable().optional(),
  postalCode: z.string().min(1).max(20).nullable().optional(),
  countryCode: z.string().length(2).nullable().optional(),
  creditLimit: z.string().min(1).optional(),
  paymentTerms: z.string().min(1).max(64).nullable().optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
});

export type UpdateCustomerRequest = z.infer<typeof updateCustomerRequestSchema>;
