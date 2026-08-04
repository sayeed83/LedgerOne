import { z } from "zod";

export const updateUserRequestSchema = z.object({
  companyUuid: z.string().uuid().optional(),
  branchUuid: z.string().uuid().nullable().optional(),
  departmentUuid: z.string().uuid().nullable().optional(),
  firstName: z.string().min(1).optional(),
  middleName: z.string().min(1).nullable().optional(),
  lastName: z.string().min(1).optional(),
  displayName: z.string().min(1).nullable().optional(),
  email: z.string().email().optional(),
  mobileNumber: z.string().min(1).nullable().optional(),
});

export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;
