/** Mirrors 00_BUSINESS_RULES.md Ch.17.5 Account lifecycle exactly (05_CODING_STANDARDS.md Ch.26.4): Draft (proposed) -> Active (approved, postable) -> Inactive (no new postings) -> Active (reactivated). */
export enum AccountStatus {
  Draft = "DRAFT",
  Active = "ACTIVE",
  Inactive = "INACTIVE",
}
