// Maps this module's Domain errors to the HTTP status/code pair
// (07_REST_API_STANDARDS.md §5.3/§9.4). The handbook's documented mechanism
// for this is a single centralized error-handling middleware
// (05_CODING_STANDARDS.md Ch.18.5/Ch.31.5) — out of scope for this task.
// Kept here as a plain function, called from each controller's own catch
// block, so the mapping table still lives in exactly one place rather than
// being duplicated per controller; this is an interim measure until the
// real centralized middleware exists.
import {
  DomainError,
  TenantNotFoundError,
  TenantSettingsNotFoundError,
  TenantSubscriptionNotFoundError,
  InvalidTenantStatusTransitionError,
  TenantNotActiveError,
  CompanyNotFoundError,
  BranchNotFoundError,
  DepartmentNotFoundError,
  InvalidCompanyStatusTransitionError,
  DuplicateCompanyCodeError,
  DuplicateBranchCodeError,
  DuplicateDepartmentCodeError,
} from "../../business/organization-errors";

export interface HttpErrorMapping {
  status: number;
  code: string;
}

export function mapDomainErrorToHttp(error: DomainError): HttpErrorMapping {
  if (error instanceof TenantNotFoundError) {
    return { status: 404, code: "ORG_TENANT_NOT_FOUND" };
  }
  if (error instanceof TenantSettingsNotFoundError) {
    return { status: 404, code: "ORG_TENANT_SETTINGS_NOT_FOUND" };
  }
  if (error instanceof TenantSubscriptionNotFoundError) {
    return { status: 404, code: "ORG_TENANT_SUBSCRIPTION_NOT_FOUND" };
  }
  if (error instanceof InvalidTenantStatusTransitionError) {
    return { status: 409, code: "ORG_INVALID_STATUS_TRANSITION" };
  }
  if (error instanceof TenantNotActiveError) {
    return { status: 403, code: "ORG_TENANT_NOT_ACTIVE" };
  }
  if (error instanceof CompanyNotFoundError) {
    return { status: 404, code: "ORG_COMPANY_NOT_FOUND" };
  }
  if (error instanceof BranchNotFoundError) {
    return { status: 404, code: "ORG_BRANCH_NOT_FOUND" };
  }
  if (error instanceof DepartmentNotFoundError) {
    return { status: 404, code: "ORG_DEPARTMENT_NOT_FOUND" };
  }
  if (error instanceof InvalidCompanyStatusTransitionError) {
    return { status: 409, code: "ORG_INVALID_COMPANY_STATUS_TRANSITION" };
  }
  if (error instanceof DuplicateCompanyCodeError) {
    return { status: 409, code: "ORG_DUPLICATE_COMPANY_CODE" };
  }
  if (error instanceof DuplicateBranchCodeError) {
    return { status: 409, code: "ORG_DUPLICATE_BRANCH_CODE" };
  }
  if (error instanceof DuplicateDepartmentCodeError) {
    return { status: 409, code: "ORG_DUPLICATE_DEPARTMENT_CODE" };
  }
  // Per 07_REST_API_STANDARDS.md §9.4's default for module-specific business
  // errors not individually listed.
  return { status: 422, code: "ORG_DOMAIN_ERROR" };
}
