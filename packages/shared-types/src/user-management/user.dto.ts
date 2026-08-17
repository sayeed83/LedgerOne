// Mirrors apps/api/src/shared/user-management/domain/enums/user-status.enum.ts.
export enum UserStatus {
  Invited = "INVITED",
  Active = "ACTIVE",
  Suspended = "SUSPENDED",
  Deactivated = "DEACTIVATED",
}

// Mirrors presentation/dto/responses/user.response.dto.ts.
export interface UserResponseDto {
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
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

// `tenantId` is not part of this shape — it travels via the `X-Tenant-Id`
// header, derived server-side from the JWT (rewriteHeaderAs: "decimal"),
// mirroring create-user.dto.ts. `invite-user.dto.ts` on the backend reuses
// this exact same shape under a different name.
export interface CreateUserRequestDto {
  companyUuid: string;
  branchUuid?: string | null;
  departmentUuid?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  displayName?: string | null;
  email: string;
  mobileNumber?: string | null;
}

export type InviteUserRequestDto = CreateUserRequestDto;

export interface UpdateUserRequestDto {
  companyUuid?: string;
  branchUuid?: string | null;
  departmentUuid?: string | null;
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  displayName?: string | null;
  email?: string;
  mobileNumber?: string | null;
}
