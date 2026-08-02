# 01_foundation/

**Purpose:** Prompts for building the core domain primitives that every other module depends on — base entities, shared value objects, the fundamental ledger/double-entry model, and common conventions.

**Contents:** Prompt files describing implementation of foundational building blocks (e.g. `00_base_entities.md`, `01_ledger_core.md`, `02_shared_value_objects.md`).

**When to use:** Early in the project, before any business module (accounting, inventory, sales, etc.) is built. Revisit only when a foundational primitive needs to change — such changes should also produce an ADR in [../../architecture-decisions/](../../architecture-decisions/) since they affect every downstream module.
