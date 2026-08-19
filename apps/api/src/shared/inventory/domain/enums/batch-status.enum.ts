/** Mirrors 00_BUSINESS_RULES.md Ch.40.5's Batch lifecycle exactly (05_CODING_STANDARDS.md Ch.26.4): Active (received into Stock) -> Depleted (quantity reaches zero through Issues) / Expired (expiry date passed, quantity remaining) -> Disposed (written off via Inventory Adjustment, Ch.44). */
export enum BatchStatus {
  Active = "ACTIVE",
  Depleted = "DEPLETED",
  Expired = "EXPIRED",
  Disposed = "DISPOSED",
}
