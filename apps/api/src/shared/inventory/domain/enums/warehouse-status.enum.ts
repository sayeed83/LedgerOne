/** Mirrors 00_BUSINESS_RULES.md Ch.37.5 Warehouse lifecycle exactly (05_CODING_STANDARDS.md Ch.26.4): Active (created under a Branch) -> Inactive (closed operationally, stock relocated). */
export enum WarehouseStatus {
  Active = "ACTIVE",
  Inactive = "INACTIVE",
}
