import { z } from "zod";

// VAL-001/VAL-004: convenience-only client validation (FP4) mirroring the
// backend's create-branch.dto.ts/update-branch.dto.ts wire shape.
// `companyUuid` is supplied by the screen (the Company the operator is
// currently browsing), not entered by hand — kept out of this form schema.
export const branchFormSchema = z.object({
  branchCode: z.string().min(1, "Branch code is required."),
  branchName: z.string().min(1, "Branch name is required."),
  addressLine1: z.string().min(1, "Address line 1 is required."),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required."),
  region: z.string().optional(),
  postalCode: z.string().optional(),
  countryCode: z.string().min(1, "Country code is required."),
  timeZone: z.string().min(1, "Time zone is required."),
});

export type BranchFormValues = z.infer<typeof branchFormSchema>;
