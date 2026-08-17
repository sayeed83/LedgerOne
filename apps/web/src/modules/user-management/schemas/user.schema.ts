import { z } from "zod";

// VAL-001/VAL-004: convenience-only client validation (FP4) mirroring the
// backend's create-user.dto.ts/invite-user.dto.ts/update-user.dto.ts wire
// shape. Optional uuid fields are modeled as empty-string-or-uuid since a
// native `<select>` has no `null` value — the form maps `""` to `null`
// before submission (see UserForm.tsx).
export const userFormSchema = z.object({
  companyUuid: z.string().uuid("Select a Company."),
  branchUuid: z.union([z.string().uuid(), z.literal("")]),
  departmentUuid: z.union([z.string().uuid(), z.literal("")]),
  firstName: z.string().min(1, "First name is required."),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required."),
  displayName: z.string().optional(),
  email: z.string().email("Enter a valid email address."),
  mobileNumber: z.string().optional(),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
