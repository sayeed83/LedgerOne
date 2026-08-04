import { z } from "zod";

// `moduleName` is an optional query filter narrowing the platform-wide list
// to one owning module (PRM-001), mirroring User Management's
// list-users-query.dto.ts optional-filter shape.
export const listPermissionsQuerySchema = z.object({
  moduleName: z.string().min(1).optional(),
});

export type ListPermissionsQuery = z.infer<typeof listPermissionsQuerySchema>;
