import { z } from "zod";

// Status transitions are not part of this milestone (mirrors
// UpdateBranchProps, 05_CODING_STANDARDS.md Ch.14.4).
export const updateBranchRequestSchema = z.object({
  branchCode: z.string().min(1).optional(),
  branchName: z.string().min(1).optional(),
  addressLine1: z.string().min(1).optional(),
  addressLine2: z.string().min(1).nullable().optional(),
  city: z.string().min(1).optional(),
  region: z.string().min(1).nullable().optional(),
  postalCode: z.string().min(1).nullable().optional(),
  countryCode: z.string().min(1).optional(),
  timeZone: z.string().min(1).optional(),
});

export type UpdateBranchRequest = z.infer<typeof updateBranchRequestSchema>;
