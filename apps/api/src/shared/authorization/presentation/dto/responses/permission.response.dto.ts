import { z } from "zod";
import { PermissionAction } from "../../../business/authorization-types";

// Never the `Permission` Domain entity itself (05_CODING_STANDARDS.md
// Ch.16.3). Internal `id` is never serialized (06_DATABASE_STANDARDS.md
// PK-003) — `uuid` and `permissionKey` (the `module.resource.action`
// external identifier, 03_ARCHITECTURE.md Ch.9.5) are what cross the API
// boundary.
export const permissionResponseSchema = z.object({
  uuid: z.string().uuid(),
  permissionKey: z.string(),
  moduleName: z.string(),
  resource: z.string(),
  action: z.nativeEnum(PermissionAction),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PermissionResponse = z.infer<typeof permissionResponseSchema>;

/** Structural rather than importing the Domain `Permission` type (Presentation must not import domain/, Ch.9.3). */
interface PermissionLike {
  uuid: string;
  permissionKey: string;
  moduleName: string;
  resource: string;
  action: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toPermissionResponse(permission: PermissionLike): PermissionResponse {
  return {
    uuid: permission.uuid,
    permissionKey: permission.permissionKey,
    moduleName: permission.moduleName,
    resource: permission.resource,
    action: permission.action as PermissionAction,
    description: permission.description,
    createdAt: permission.createdAt,
    updatedAt: permission.updatedAt,
  };
}
