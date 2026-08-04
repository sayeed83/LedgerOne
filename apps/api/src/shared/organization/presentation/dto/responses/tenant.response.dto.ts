import { z } from "zod";
import { TenantStatus } from "../../../business/organization-types";

// Never the `Tenant` Domain aggregate itself (05_CODING_STANDARDS.md
// Ch.16.3) — a separate, flatter shape. Internal `id`/`createdBy`/
// `updatedBy`/`deletedAt` are never serialized (06_DATABASE_STANDARDS.md
// PK-003).
export const tenantResponseSchema = z.object({
  uuid: z.string().uuid(),
  legalName: z.string(),
  primaryContactEmail: z.string(),
  status: z.nativeEnum(TenantStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TenantResponse = z.infer<typeof tenantResponseSchema>;

/** Structural rather than importing the Domain `Tenant` type (Presentation must not import domain/, Ch.9.3). */
interface TenantLike {
  uuid: string;
  legalName: string;
  primaryContactEmail: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toTenantResponse(tenant: TenantLike): TenantResponse {
  return {
    uuid: tenant.uuid,
    legalName: tenant.legalName,
    primaryContactEmail: tenant.primaryContactEmail,
    status: tenant.status as TenantStatus,
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt,
  };
}
