/** Mirrors 00_BUSINESS_RULES.md Ch.45.5 Customer lifecycle exactly (05_CODING_STANDARDS.md Ch.26.4): Prospect (created, no transactions yet) -> Active (first Sales Order/Invoice) -> OnHold (credit limit exceeded or payment overdue) -> Active (balance settled/limit revised); Active -> Inactive (no longer transacting). */
export enum CustomerStatus {
  Prospect = "PROSPECT",
  Active = "ACTIVE",
  OnHold = "ON_HOLD",
  Inactive = "INACTIVE",
}
