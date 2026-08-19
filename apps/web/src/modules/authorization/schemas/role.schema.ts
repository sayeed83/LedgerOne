import { z } from "zod";

// Mirrors the backend's create/update-role.dto.ts field shapes exactly
// (00_BUSINESS_RULES.md Ch.11) — no invented validation rules.
export const roleFormSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string().optional(),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;
