import { z } from "zod";

// Represents a Role↔Permission grant (00_BUSINESS_RULES.md Ch.11.3/Ch.12.10).
// The `RolePermission` Domain entity itself only carries the internal
// `roleId`/`permissionId` (bigint, never serialized — 06_DATABASE_STANDARDS.md
// PK-003), so this mapper takes the two external identifiers the controller
// already resolved (`roleUuid` from the path, `permissionKey` from the
// body) alongside the grant row's own `uuid`/`createdAt`.
export const rolePermissionResponseSchema = z.object({
  uuid: z.string().uuid(),
  roleUuid: z.string().uuid(),
  permissionKey: z.string(),
  createdAt: z.date(),
});

export type RolePermissionResponse = z.infer<typeof rolePermissionResponseSchema>;

/** Structural rather than importing the Domain `RolePermission` type (Presentation must not import domain/, Ch.9.3). */
interface RolePermissionLike {
  uuid: string;
  createdAt: Date;
}

export function toRolePermissionResponse(
  rolePermission: RolePermissionLike,
  roleUuid: string,
  permissionKey: string,
): RolePermissionResponse {
  return {
    uuid: rolePermission.uuid,
    roleUuid,
    permissionKey,
    createdAt: rolePermission.createdAt,
  };
}
