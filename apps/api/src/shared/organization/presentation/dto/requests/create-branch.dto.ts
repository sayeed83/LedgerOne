import { z } from "zod";

// `tenantUuid` arrives via the `X-Tenant-Id` header (tenant-context, not
// branch-specific data); `companyUuid` identifies which Company this
// Branch belongs to (00_BUSINESS_RULES.md BRN-001) and must be supplied in
// the body since the route carries neither segment.
export const createBranchRequestSchema = z.object({
  companyUuid: z.string().uuid(),
  branchCode: z.string().min(1),
  branchName: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().min(1).nullable().optional(),
  city: z.string().min(1),
  region: z.string().min(1).nullable().optional(),
  postalCode: z.string().min(1).nullable().optional(),
  countryCode: z.string().min(1),
  timeZone: z.string().min(1),
});

export type CreateBranchRequest = z.infer<typeof createBranchRequestSchema>;
