// Re-exports the Domain error hierarchy through the Business layer's public
// surface. 04_FOLDER_STRUCTURE.md §19.3: `presentation/` may import
// `business/` only, never `domain/` directly — this file is that seam.
export * from "../domain/errors/accounting.errors";
