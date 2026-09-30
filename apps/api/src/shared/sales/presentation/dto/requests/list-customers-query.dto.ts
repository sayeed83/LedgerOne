import { z } from "zod";

// No filters — mirrors the Business layer's own tenant-wide `listCustomers`
// shape (list-roles.controller.ts's own identical no-query-param
// convention, authorization module). Kept as an explicit (empty) schema
// rather than skipping validation entirely, so this endpoint follows the
// same "parse, don't assume" shape every other list endpoint in this module
// follows.
export const listCustomersQuerySchema = z.object({});

export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
