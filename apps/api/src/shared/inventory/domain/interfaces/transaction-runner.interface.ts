// Domain-owned collaborator interface (03_ARCHITECTURE.md Decision 5.7.2) —
// lets the Business layer open one atomic Prisma transaction spanning
// multiple Repository calls (05_CODING_STANDARDS.md Ch.20.3 — "a use case
// that writes to more than one table must wrap those writes in a single
// Prisma `$transaction`") without importing the Prisma client itself
// (Ch.9.5 — only a module's `repository/` folder may do that). Mirrors
// Accounting's own `ITransactionRunner` exactly (same per-module-copy
// convention as every other Domain-owned interface in this codebase — no
// cross-module shared interface).
//
// `createStockMovement` (Ch.39/STM-001) is this module's first use case
// needing this: it writes both `stock_movements` (the immutable movement
// record, STM-002) and `stocks` (the on-hand/available balance the movement
// affects) — one atomic transaction coordinated here at the Business layer,
// so a Stock Movement can never be recorded without its corresponding Stock
// balance update actually landing (and vice versa).
//
// The `tx` handle passed to the callback is intentionally `unknown` — the
// same value `IInventoryRepository`'s own `RepositoryTransaction` type
// already accepts (both are structurally `unknown`), so it can be passed to
// `IInventoryRepository` methods without this interface depending on it.
export interface ITransactionRunner {
  run<T>(fn: (tx: unknown) => Promise<T>): Promise<T>;
}
