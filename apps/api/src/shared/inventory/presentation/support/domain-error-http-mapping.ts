// Maps this module's Domain errors to the HTTP status/code pair
// (07_REST_API_STANDARDS.md §5.3/§9.4). The handbook's documented mechanism
// for this is a single centralized error-handling middleware
// (05_CODING_STANDARDS.md Ch.18.5/Ch.31.5) — out of scope for this task.
// Kept here as a plain function, called from each controller's own catch
// block, so the mapping table still lives in exactly one place rather than
// being duplicated per controller; this is an interim measure until the
// real centralized middleware exists, mirroring Accounting's own
// domain-error-http-mapping.ts exactly.
import { DomainError, ProductCategoryNotFoundError, DuplicateProductCategoryNameError } from "../../business/inventory-errors";

export interface HttpErrorMapping {
  status: number;
  code: string;
}

export function mapDomainErrorToHttp(error: DomainError): HttpErrorMapping {
  if (error instanceof ProductCategoryNotFoundError) {
    return { status: 404, code: "INV_PRODUCT_CATEGORY_NOT_FOUND" };
  }
  if (error instanceof DuplicateProductCategoryNameError) {
    return { status: 409, code: "INV_DUPLICATE_PRODUCT_CATEGORY_NAME" };
  }
  // Per 07_REST_API_STANDARDS.md §9.4's default for module-specific business
  // errors not individually listed.
  return { status: 422, code: "INV_DOMAIN_ERROR" };
}
