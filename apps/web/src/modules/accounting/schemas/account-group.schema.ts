import { z } from "zod";
import { AccountType } from "@ledgerone/shared-types";
import { uuidSchema } from "./shared.schema";

export const accountGroupFormSchema = z.object({
  companyUuid: uuidSchema,
  name: z.string().min(1, "Name is required.").max(100, "Name must be at most 100 characters."),
  accountType: z.nativeEnum(AccountType, { errorMap: () => ({ message: "Select an account type." }) }),
  parentAccountGroupUuid: z.string().optional(),
});

export type AccountGroupFormValues = z.infer<typeof accountGroupFormSchema>;
