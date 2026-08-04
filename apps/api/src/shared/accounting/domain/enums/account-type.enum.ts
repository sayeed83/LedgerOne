/** The five fundamental account classifications (00_BUSINESS_RULES.md Ch.16 DBL-003/Ch.17.7 COA-001), shared by `Account` and `AccountGroup` (Ch.18 AGP-002). Mirrors the Prisma schema exactly (05_CODING_STANDARDS.md Ch.26.4). */
export enum AccountType {
  Asset = "ASSET",
  Liability = "LIABILITY",
  Equity = "EQUITY",
  Revenue = "REVENUE",
  Expense = "EXPENSE",
}
