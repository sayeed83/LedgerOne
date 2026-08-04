// Re-exports Domain-owned enums through the Business layer's public
// surface, same seam as organization-errors.ts. 04_FOLDER_STRUCTURE.md
// §19.3 / 05_CODING_STANDARDS.md Ch.9.3: `presentation/` may import
// `business/` only, never `domain/` directly — a Presentation-layer Zod
// schema that needs to validate against these enums' exact values (e.g.
// `z.nativeEnum(...)`) imports them from here.
export { TenantStatus } from "../domain/enums/tenant-status.enum";
export { TenantSubscriptionStatus } from "../domain/enums/tenant-subscription-status.enum";
export { CompanyStatus } from "../domain/enums/company-status.enum";
export { BranchStatus } from "../domain/enums/branch-status.enum";
export { DepartmentStatus } from "../domain/enums/department-status.enum";
