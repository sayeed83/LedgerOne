import { z } from "zod";

// `tenantUuid` arrives via the `X-Tenant-Id` header (tenant context, not
// department-specific data); `companyUuid` identifies which Company this
// Department belongs to (00_BUSINESS_RULES.md DPT-001) and must be
// supplied in the body since the route carries neither segment.
export const createDepartmentRequestSchema = z.object({
  companyUuid: z.string().uuid(),
  departmentCode: z.string().min(1),
  departmentName: z.string().min(1),
});

export type CreateDepartmentRequest = z.infer<typeof createDepartmentRequestSchema>;
