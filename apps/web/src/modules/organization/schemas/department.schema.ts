import { z } from "zod";

// VAL-001/VAL-004: convenience-only client validation (FP4) mirroring the
// backend's create-department.dto.ts/update-department.dto.ts wire shape.
// `companyUuid` is supplied by the screen, not entered by hand.
export const departmentFormSchema = z.object({
  departmentCode: z.string().min(1, "Department code is required."),
  departmentName: z.string().min(1, "Department name is required."),
});

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;
