import { z } from "zod";

export const assignPermissionRequestSchema = z.object({
  permissionKey: z.string().min(1),
});

export type AssignPermissionRequest = z.infer<typeof assignPermissionRequestSchema>;
