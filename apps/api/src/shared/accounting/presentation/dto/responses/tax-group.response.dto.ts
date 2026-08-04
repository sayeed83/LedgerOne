import { z } from "zod";

// Never the `TaxGroup` Domain entity itself (05_CODING_STANDARDS.md
// Ch.16.3) — a separate, flatter shape. Internal `id`/`tenantId`/
// `createdBy`/`updatedBy`/`deletedAt` are never serialized
// (06_DATABASE_STANDARDS.md PK-003) — only `uuid` (and the cross-module
// `companyUuid` reference) crosses the API boundary.
export const taxGroupResponseSchema = z.object({
  uuid: z.string().uuid(),
  companyUuid: z.string().uuid(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TaxGroupResponse = z.infer<typeof taxGroupResponseSchema>;

/** Structural rather than importing the Domain `TaxGroup` type (Presentation must not import domain/, Ch.9.3). */
interface TaxGroupLike {
  uuid: string;
  companyUuid: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toTaxGroupResponse(taxGroup: TaxGroupLike): TaxGroupResponse {
  return {
    uuid: taxGroup.uuid,
    companyUuid: taxGroup.companyUuid,
    name: taxGroup.name,
    createdAt: taxGroup.createdAt,
    updatedAt: taxGroup.updatedAt,
  };
}
