import { z } from "zod";

// `tenantId` arrives via the `X-Tenant-Id` header (tenant-context, not
// user-specific data). `companyUuid`/`branchUuid`/`departmentUuid` identify
// which Organization row this User is scoped to and must be supplied in
// the body since the route carries no segment for them (mirrors
// Organization's own create-branch.dto.ts, which takes `companyUuid` in
// the body for the same reason).
export const createUserRequestSchema = z.object({
  companyUuid: z.string().uuid(),
  branchUuid: z.string().uuid().nullable().optional(),
  departmentUuid: z.string().uuid().nullable().optional(),
  firstName: z.string().min(1),
  middleName: z.string().min(1).nullable().optional(),
  lastName: z.string().min(1),
  displayName: z.string().min(1).nullable().optional(),
  email: z.string().email(),
  mobileNumber: z.string().min(1).nullable().optional(),
});

export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;
