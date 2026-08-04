import { z } from "zod";
import { BranchStatus } from "../../../business/organization-types";

// Never the `Branch` Domain entity itself (05_CODING_STANDARDS.md Ch.16.3)
// — a separate, flatter shape. Internal `id`/`tenantId`/`companyId`/
// `createdBy`/`updatedBy`/`deletedAt` are never serialized
// (06_DATABASE_STANDARDS.md PK-003).
export const branchResponseSchema = z.object({
  uuid: z.string().uuid(),
  branchCode: z.string(),
  branchName: z.string(),
  status: z.nativeEnum(BranchStatus),
  addressLine1: z.string(),
  addressLine2: z.string().nullable(),
  city: z.string(),
  region: z.string().nullable(),
  postalCode: z.string().nullable(),
  countryCode: z.string(),
  timeZone: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BranchResponse = z.infer<typeof branchResponseSchema>;

/** Structural rather than importing the Domain `Branch` type (Presentation must not import domain/, Ch.9.3). */
interface BranchLike {
  uuid: string;
  branchCode: string;
  branchName: string;
  status: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string | null;
  postalCode: string | null;
  countryCode: string;
  timeZone: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toBranchResponse(branch: BranchLike): BranchResponse {
  return {
    uuid: branch.uuid,
    branchCode: branch.branchCode,
    branchName: branch.branchName,
    status: branch.status as BranchStatus,
    addressLine1: branch.addressLine1,
    addressLine2: branch.addressLine2,
    city: branch.city,
    region: branch.region,
    postalCode: branch.postalCode,
    countryCode: branch.countryCode,
    timeZone: branch.timeZone,
    createdAt: branch.createdAt,
    updatedAt: branch.updatedAt,
  };
}
