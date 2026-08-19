/** Mirrors 00_BUSINESS_RULES.md Ch.39.1's four named business event kinds exactly (05_CODING_STANDARDS.md Ch.26.4) — not a two-value direction flag, since a Transfer is simultaneously inbound and outbound (STM-003). */
export enum StockMovementType {
  Receipt = "RECEIPT",
  Issue = "ISSUE",
  Transfer = "TRANSFER",
  Adjustment = "ADJUSTMENT",
}
