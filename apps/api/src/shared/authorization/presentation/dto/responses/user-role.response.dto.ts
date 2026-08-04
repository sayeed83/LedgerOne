import { z } from "zod";

// Represents a User↔Role assignment (00_BUSINESS_RULES.md Ch.11.10). The
// `UserRole` Domain entity carries `userUuid` directly but only the internal
// `roleId` (bigint, never serialized — 06_DATABASE_STANDARDS.md PK-003) for
// the Role side, so this mapper takes the `roleUuid` the controller already
// resolved from the path alongside the assignment row's own `uuid`/
// `userUuid`/`createdAt`.
export const userRoleResponseSchema = z.object({
  uuid: z.string().uuid(),
  userUuid: z.string().uuid(),
  roleUuid: z.string().uuid(),
  createdAt: z.date(),
});

export type UserRoleResponse = z.infer<typeof userRoleResponseSchema>;

/** Structural rather than importing the Domain `UserRole` type (Presentation must not import domain/, Ch.9.3). */
interface UserRoleLike {
  uuid: string;
  userUuid: string;
  createdAt: Date;
}

export function toUserRoleResponse(userRole: UserRoleLike, roleUuid: string): UserRoleResponse {
  return {
    uuid: userRole.uuid,
    userUuid: userRole.userUuid,
    roleUuid,
    createdAt: userRole.createdAt,
  };
}
