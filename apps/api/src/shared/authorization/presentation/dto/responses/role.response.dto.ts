import { z } from "zod";
import { RoleStatus } from "../../../business/authorization-types";

// Never the `Role` Domain aggregate itself (05_CODING_STANDARDS.md Ch.16.3)
// — a separate, flatter shape. Internal `id`/`tenantId`/`createdBy`/
// `updatedBy`/`deletedAt` are never serialized (06_DATABASE_STANDARDS.md
// PK-003) — only `uuid` crosses the API boundary.
export const roleResponseSchema = z.object({
  uuid: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isSystemRole: z.boolean(),
  status: z.nativeEnum(RoleStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type RoleResponse = z.infer<typeof roleResponseSchema>;

/** Structural rather than importing the Domain `Role` type (Presentation must not import domain/, Ch.9.3). */
interface RoleLike {
  uuid: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toRoleResponse(role: RoleLike): RoleResponse {
  return {
    uuid: role.uuid,
    name: role.name,
    description: role.description,
    isSystemRole: role.isSystemRole,
    status: role.status as RoleStatus,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}
