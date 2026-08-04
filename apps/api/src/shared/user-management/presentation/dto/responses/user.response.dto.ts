import { z } from "zod";
import { UserStatus } from "../../../business/user-management-types";

// Never the `User` Domain aggregate itself (05_CODING_STANDARDS.md Ch.16.3)
// — a separate, flatter shape. Internal `id`/`tenantId`/`createdBy`/
// `updatedBy`/`deletedAt` are never serialized (06_DATABASE_STANDARDS.md
// PK-003) — only `uuid` and the cross-module `companyUuid`/`branchUuid`/
// `departmentUuid` references cross the API boundary.
export const userResponseSchema = z.object({
  uuid: z.string().uuid(),
  companyUuid: z.string().uuid(),
  branchUuid: z.string().uuid().nullable(),
  departmentUuid: z.string().uuid().nullable(),
  firstName: z.string(),
  middleName: z.string().nullable(),
  lastName: z.string(),
  displayName: z.string().nullable(),
  email: z.string(),
  mobileNumber: z.string().nullable(),
  status: z.nativeEnum(UserStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;

/** Structural rather than importing the Domain `User` type (Presentation must not import domain/, Ch.9.3). */
interface UserLike {
  uuid: string;
  companyUuid: string;
  branchUuid: string | null;
  departmentUuid: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  displayName: string | null;
  email: string;
  mobileNumber: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toUserResponse(user: UserLike): UserResponse {
  return {
    uuid: user.uuid,
    companyUuid: user.companyUuid,
    branchUuid: user.branchUuid,
    departmentUuid: user.departmentUuid,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    displayName: user.displayName,
    email: user.email,
    mobileNumber: user.mobileNumber,
    status: user.status as UserStatus,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
