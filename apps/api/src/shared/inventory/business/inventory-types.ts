// Re-exports Domain-owned enums through the Business layer's public
// surface, same seam as inventory-errors.ts. 04_FOLDER_STRUCTURE.md
// §19.3 / 05_CODING_STANDARDS.md Ch.9.3: `presentation/` may import
// `business/` only, never `domain/` directly — a Presentation-layer Zod
// schema that needs to validate against this enum's exact values (e.g.
// `z.nativeEnum(...)`) imports it from here. Product Category and Unit have
// no enum/value-object of their own, so this file did not exist before
// Product (Ch.34) introduced `ProductStatus` — added now, exactly when a
// Presentation layer first needs it.
export { ProductStatus } from "../domain/enums/product-status.enum";
