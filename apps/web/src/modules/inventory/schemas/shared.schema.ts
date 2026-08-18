import { z } from "zod";

// Mirrors Accounting's own schemas/shared.schema.ts's identical
// `uuidSchema` export — a shared, human-readable validator (VAL-004)
// reused across every Inventory form's picker fields.
export const uuidSchema = z.string().uuid("Select a valid option.");
