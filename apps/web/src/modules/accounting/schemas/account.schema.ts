import { z } from "zod";
import { AccountType } from "@ledgerone/shared-types";
import { uuidSchema } from "./shared.schema";

export const accountFormSchema = z.object({
  companyUuid: uuidSchema,
  code: z.string().min(1, "Code is required.").max(20, "Code must be at most 20 characters."),
  name: z.string().min(1, "Name is required.").max(150, "Name must be at most 150 characters."),
  accountType: z.nativeEnum(AccountType, { errorMap: () => ({ message: "Select an account type." }) }),
  accountGroupUuid: uuidSchema,
  parentAccountUuid: z.string().optional(),
  isPostingAccount: z.boolean().default(true),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;
