/** Mirrors 00_BUSINESS_RULES.md Ch.34.5 Product lifecycle exactly (05_CODING_STANDARDS.md Ch.26.4): Draft (created) -> Active (approved, available for transactions) -> Discontinued (no longer sold/purchased, historical data retained) -> Active (reintroduced). */
export enum ProductStatus {
  Draft = "DRAFT",
  Active = "ACTIVE",
  Discontinued = "DISCONTINUED",
}
