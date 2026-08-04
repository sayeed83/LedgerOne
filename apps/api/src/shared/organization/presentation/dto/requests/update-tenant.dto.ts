import { z } from "zod";

export const updateTenantRequestSchema = z.object({
  legalName: z.string().min(1).optional(),
  primaryContactEmail: z.string().email().optional(),
});

export type UpdateTenantRequest = z.infer<typeof updateTenantRequestSchema>;
