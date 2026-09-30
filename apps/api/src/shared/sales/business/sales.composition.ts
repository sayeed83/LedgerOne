// Composition root (05_CODING_STANDARDS.md Ch.10.4) — the one place that
// wires concrete implementations to the interfaces every use-case service
// depends on. No DI container (Ch.10.5); plain manual construction. Not
// used by unit tests, which build their own fake `deps` (Ch.10.6) — this
// file is for the Presentation layer to import, mirroring Organization's
// own `organization.composition.ts` exactly.
import { PrismaSalesRepository } from "../repository/sales.repository";

export function createSalesDependencies() {
  return {
    repository: new PrismaSalesRepository(),
  };
}

/** The shape every Presentation-layer controller in this module depends on — real deps here, fakes in tests (Ch.10.6). */
export type SalesDependencies = ReturnType<typeof createSalesDependencies>;
