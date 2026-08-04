import { z } from "zod";

// `companyUuid` is an optional query filter narrowing the tenant-wide list
// to one Company (mirrors listUsers's own optional-filter shape).
export const listUsersQuerySchema = z.object({
  companyUuid: z.string().uuid().optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
