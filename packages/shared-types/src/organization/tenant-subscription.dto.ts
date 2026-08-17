// Mirrors apps/api/src/shared/organization/domain/enums/tenant-subscription-status.enum.ts.
export enum TenantSubscriptionStatus {
  Provisioning = "PROVISIONING",
  Active = "ACTIVE",
  Suspended = "SUSPENDED",
  Deactivated = "DEACTIVATED",
}

// Mirrors presentation/dto/responses/tenant-subscription.response.dto.ts.
export interface TenantSubscriptionResponseDto {
  uuid: string;
  planCode: string;
  subscribedModules: string[];
  status: TenantSubscriptionStatus;
  currentPeriodStartsAt: string;
  currentPeriodEndsAt: string;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTenantSubscriptionRequestDto {
  planCode?: string;
  subscribedModules?: string[];
  status?: TenantSubscriptionStatus;
  currentPeriodStartsAt?: string;
  currentPeriodEndsAt?: string;
  cancelledAt?: string | null;
}
