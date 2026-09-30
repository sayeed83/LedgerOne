// Re-exports the Domain error hierarchy through the Business layer's public
// surface. 04_FOLDER_STRUCTURE.md §19.3: `presentation/` may import
// `business/` only, never `domain/` directly — this file is that seam,
// mirroring Inventory's own `inventory-errors.ts` exactly.
export * from "../domain/errors/sales.errors";
