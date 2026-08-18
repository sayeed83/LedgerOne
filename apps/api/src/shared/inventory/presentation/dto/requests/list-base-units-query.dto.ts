import { z } from "zod";

// `companyUuid` is required, not optional — mirrors the Business layer's
// own `listBaseUnits` shape.
export const listBaseUnitsQuerySchema = z.object({
  companyUuid: z.string().uuid(),
});

export type ListBaseUnitsQuery = z.infer<typeof listBaseUnitsQuerySchema>;
