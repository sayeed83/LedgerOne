import { z } from "zod";
import { CustomerStatus } from "../../../business/sales-types";

// Never the `Customer` Domain entity itself (05_CODING_STANDARDS.md
// Ch.16.3) — a separate, flatter shape. Internal `id`/`tenantId`/
// `createdBy`/`updatedBy`/`deletedAt` are never serialized
// (06_DATABASE_STANDARDS.md PK-003), mirroring product.response.dto.ts
// exactly.
export const customerResponseSchema = z.object({
  uuid: z.string().uuid(),
  companyUuid: z.string().uuid(),
  name: z.string(),
  addressLine1: z.string().nullable(),
  addressLine2: z.string().nullable(),
  city: z.string().nullable(),
  region: z.string().nullable(),
  postalCode: z.string().nullable(),
  countryCode: z.string().nullable(),
  creditLimit: z.string(),
  paymentTerms: z.string().nullable(),
  status: z.nativeEnum(CustomerStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CustomerResponse = z.infer<typeof customerResponseSchema>;

/** Structural rather than importing the Domain `Customer` type (Presentation must not import domain/, Ch.9.3). */
interface CustomerLike {
  uuid: string;
  companyUuid: string;
  name: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  countryCode: string | null;
  creditLimit: string;
  paymentTerms: string | null;
  status: CustomerStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function toCustomerResponse(customer: CustomerLike): CustomerResponse {
  return {
    uuid: customer.uuid,
    companyUuid: customer.companyUuid,
    name: customer.name,
    addressLine1: customer.addressLine1,
    addressLine2: customer.addressLine2,
    city: customer.city,
    region: customer.region,
    postalCode: customer.postalCode,
    countryCode: customer.countryCode,
    creditLimit: customer.creditLimit,
    paymentTerms: customer.paymentTerms,
    status: customer.status,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}
