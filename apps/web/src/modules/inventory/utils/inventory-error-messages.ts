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
  INV_PRODUCT_NOT_FOUND: "This Product could not be found. It may have been removed.",
  INV_DUPLICATE_PRODUCT_CODE: "A Product with this code already exists in this Company.",
  INV_WAREHOUSE_NOT_FOUND: "This Warehouse could not be found. It may have been removed.",
  INV_DUPLICATE_WAREHOUSE_CODE: "A Warehouse with this code already exists in this Branch.",
  INV_DUPLICATE_WAREHOUSE_NAME: "A Warehouse with this name already exists in this Branch.",
  INV_STOCK_NOT_FOUND: "This Stock record could not be found. It may have been removed.",
  INV_STOCK_ALREADY_EXISTS: "A Stock record already exists for this Warehouse and Product.",
  INV_INVENTORY_ADJUSTMENT_NOT_FOUND: "This Inventory Adjustment could not be found. It may have been removed.",
  INV_STOCK_MOVEMENT_NOT_FOUND: "This Stock Movement could not be found. It may have been removed.",
  INV_STOCK_MOVEMENT_INVALID_WAREHOUSE:
    "This movement type requires a different set of Warehouses. Check the source/destination Warehouse fields.",
  INV_BATCH_NOT_FOUND: "This Batch could not be found. It may have been removed.",
  INV_INVALID_BATCH_DATE_RANGE: "Manufacture date must not be after the expiry date.",
  INV_REORDER_LEVEL_NOT_FOUND: "This Reorder Level could not be found. It may have been removed.",
  INV_REORDER_LEVEL_ALREADY_EXISTS: "A Reorder Level already exists for this Warehouse and Product.",
  INV_INVALID_REORDER_LEVEL_QUANTITY: "Reorder Level must be a non-negative quantity.",
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
