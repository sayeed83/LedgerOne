// 03_ARCHITECTURE.md Ch.6.7 "Module manifest / registry": each module
// declares what it publishes (contract interfaces + Domain Events it emits)
// and what it consumes (other modules' contracts it calls + events it
// subscribes to), reviewable in isolation without reading the module's
// internal implementation (Decision 6.8.3).
export interface ModuleManifest {
  /** PascalCase, singular business capability (03_ARCHITECTURE.md Ch.6.4 naming table). */
  name: string;
  description: string;
  publishes: {
    /** Published contract interfaces (Ch.6.6.1) other modules may call in-process. */
    contracts: string[];
    /** Domain Events (Ch.6.6.2/Ch.14) this module emits. */
    events: string[];
  };
  consumes: {
    /** Other modules' published contracts this module calls. */
    contracts: string[];
    /** Domain Events this module subscribes to. */
    events: string[];
  };
}
