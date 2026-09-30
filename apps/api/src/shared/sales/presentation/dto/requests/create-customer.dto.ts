import { z } from "zod";
import { CustomerStatus } from "../../../business/sales-types";

// `tenantId` arrives via the `X-Tenant-Id` header (tenant-context, not
// Customer-specific data), mirroring create-product.dto.ts. `companyUuid` is
// a cross-module reference (FK-002) to Organization's `companies.uuid` —
// accepted as client input but never validated for existence here.
// `name`/`addressLine1`/`addressLine2`/`city`/`region`/`postalCode`/
// `countryCode`/`paymentTerms` max lengths mirror the `VARCHAR(255)`/
// `VARCHAR(255)`/`VARCHAR(255)`/`VARCHAR(120)`/`VARCHAR(120)`/`VARCHAR(20)`/
// `CHAR(2)`/`VARCHAR(64)` column widths (sales.prisma). `creditLimit` is
// validated only for non-empty shape here — no threshold/CUS-002 validation
// is duplicated here, mirroring `reorderLevel`/`reorderQuantity`'s own
// quantity-field treatment (create-reorder-level.dto.ts). `status` is
// accepted as a plain, shape-only-validated enum value — the Business
// layer's own `createCustomer` performs no status-transition validation
// this milestone, so there is nothing further to enforce here either.
// `createdBy` is deliberately not accepted from the request body at all —
// no existing create DTO accepts it either (the Business layer always
// defaults it to `null`).
export const createCustomerRequestSchema = z.object({
  companyUuid: z.string().uuid(),
  name: z.string().min(1).max(255),
  addressLine1: z.string().min(1).max(255).optional(),
  addressLine2: z.string().min(1).max(255).optional(),
  city: z.string().min(1).max(120).optional(),
  region: z.string().min(1).max(120).optional(),
  postalCode: z.string().min(1).max(20).optional(),
  countryCode: z.string().length(2).optional(),
  creditLimit: z.string().min(1).optional(),
  paymentTerms: z.string().min(1).max(64).optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
});

export type CreateCustomerRequest = z.infer<typeof createCustomerRequestSchema>;
