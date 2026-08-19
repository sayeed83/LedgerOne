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

// Unlike UpdateTenantSubscriptionRequestDto, `status` is deliberately
// omitted — a new subscription always starts at its schema default
// (Provisioning); only an update may change it later. Every other field is
// required — no default plan/module list is documented
// (00_BUSINESS_RULES.md Ch.1.22 defers subscription self-service).
export interface CreateTenantSubscriptionRequestDto {
  planCode: string;
  subscribedModules: string[];
  currentPeriodStartsAt: string;
  currentPeriodEndsAt: string;
}
