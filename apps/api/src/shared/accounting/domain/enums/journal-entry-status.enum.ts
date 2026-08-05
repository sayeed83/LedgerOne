/** Mirrors 00_BUSINESS_RULES.md Ch.20.5 Journal Entry lifecycle exactly (05_CODING_STANDARDS.md Ch.26.4): Draft (created, editable) -> PendingApproval (submitted, above threshold, JRN-004) -> Posted (approved, or posted directly if below threshold) -> Reversed (a reversing entry created and posted). "Rejected" (Ch.13.5/Ch.20.5) is a transition back to Draft, not a fifth stored state. */
export enum JournalEntryStatus {
  Draft = "DRAFT",
  PendingApproval = "PENDING_APPROVAL",
  Posted = "POSTED",
  Reversed = "REVERSED",
}
