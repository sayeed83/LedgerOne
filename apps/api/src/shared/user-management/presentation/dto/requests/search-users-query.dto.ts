import { z } from "zod";

export const searchUsersQuerySchema = z.object({
  query: z.string().min(1),
});

export type SearchUsersQuery = z.infer<typeof searchUsersQuerySchema>;
