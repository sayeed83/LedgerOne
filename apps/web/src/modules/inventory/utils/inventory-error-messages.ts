import type { ApiError } from "@/services/api-client";

// ERR-002/003: known Inventory error codes (mirroring the backend's own
// domain-error-http-mapping.ts) map to specific, actionable copy; anything
// unmapped falls back to a safe generic message — never the raw server
// exception text, mirroring Accounting's own accounting-error-messages.ts.
const INVENTORY_ERROR_MESSAGES: Record<string, string> = {
  INV_PRODUCT_CATEGORY_NOT_FOUND: "This Product Category could not be found. It may have been removed.",
  INV_DUPLICATE_PRODUCT_CATEGORY_NAME: "A Product Category with this name already exists at this hierarchy level.",
  INV_UNIT_NOT_FOUND: "This Unit could not be found. It may have been removed.",
  INV_INVALID_UNIT_CONVERSION_FACTOR_VALUE: "Conversion factor must be a positive number.",
  INV_DOMAIN_ERROR: "Please check the highlighted fields and try again.",
  VALIDATION_ERROR: "Please check the highlighted fields and try again.",
  NETWORK_ERROR: "Unable to reach the server. Check your connection and try again.",
};

export function getInventoryErrorMessage(error: ApiError | null | undefined): string | undefined {
  if (!error) {
    return undefined;
  }
  return INVENTORY_ERROR_MESSAGES[error.code] ?? "Something went wrong. Please try again.";
}
