import { z } from "zod";

// Status is never changed here (see retire-role.controller.ts).
export const updateRoleRequestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).nullable().optional(),
});

export type UpdateRoleRequest = z.infer<typeof updateRoleRequestSchema>;
