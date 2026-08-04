import { z } from "zod";

// Path-param validator for `/roles/:roleUuid/permissions/:permissionKey`.
// `permissionKey` is the `module.resource.action` identifier
// (03_ARCHITECTURE.md Ch.9.5) — the only external identifier Permission
// exposes (it has no separate uuid path segment convention here since the
// key itself is already the natural, stable external identifier callers
// hold, mirroring how a Role/User is addressed by `uuid`).
export const rolePermissionParamsSchema = z.object({
  roleUuid: z.string().uuid(),
  permissionKey: z.string().min(1),
});

export type RolePermissionParams = z.infer<typeof rolePermissionParamsSchema>;
