import { z } from "zod";
import { DepartmentStatus } from "../../../business/organization-types";

// Never the `Department` Domain entity itself (05_CODING_STANDARDS.md
// Ch.16.3) — a separate, flatter shape. Internal `id`/`tenantId`/
// `companyId`/`createdBy`/`updatedBy`/`deletedAt` are never serialized
// (06_DATABASE_STANDARDS.md PK-003).
export const departmentResponseSchema = z.object({
  uuid: z.string().uuid(),
  departmentCode: z.string(),
  departmentName: z.string(),
  status: z.nativeEnum(DepartmentStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DepartmentResponse = z.infer<typeof departmentResponseSchema>;

/** Structural rather than importing the Domain `Department` type (Presentation must not import domain/, Ch.9.3). */
interface DepartmentLike {
  uuid: string;
  departmentCode: string;
  departmentName: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toDepartmentResponse(department: DepartmentLike): DepartmentResponse {
  return {
    uuid: department.uuid,
    departmentCode: department.departmentCode,
    departmentName: department.departmentName,
    status: department.status as DepartmentStatus,
    createdAt: department.createdAt,
    updatedAt: department.updatedAt,
  };
}
