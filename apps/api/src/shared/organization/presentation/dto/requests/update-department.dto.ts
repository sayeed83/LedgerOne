import { z } from "zod";

// Status transitions are not part of this milestone (mirrors
// UpdateDepartmentProps, 05_CODING_STANDARDS.md Ch.14.4).
export const updateDepartmentRequestSchema = z.object({
  departmentCode: z.string().min(1).optional(),
  departmentName: z.string().min(1).optional(),
});

export type UpdateDepartmentRequest = z.infer<typeof updateDepartmentRequestSchema>;
