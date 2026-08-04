import { z } from "zod";

// Path-param validator for `/users/:userUuid/roles/:roleUuid`.
export const userRoleParamsSchema = z.object({
  userUuid: z.string().uuid(),
  roleUuid: z.string().uuid(),
});

export type UserRoleParams = z.infer<typeof userRoleParamsSchema>;
