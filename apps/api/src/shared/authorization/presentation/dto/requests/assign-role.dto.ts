import { z } from "zod";

export const assignRoleRequestSchema = z.object({
  roleUuid: z.string().uuid(),
});

export type AssignRoleRequest = z.infer<typeof assignRoleRequestSchema>;
