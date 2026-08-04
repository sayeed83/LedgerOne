import { z } from "zod";

export const updateTaxGroupRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export type UpdateTaxGroupRequest = z.infer<typeof updateTaxGroupRequestSchema>;
