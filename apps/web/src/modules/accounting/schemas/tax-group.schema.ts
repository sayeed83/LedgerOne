import { z } from "zod";
import { uuidSchema } from "./shared.schema";

export const taxGroupFormSchema = z.object({
  companyUuid: uuidSchema,
  name: z.string().min(1, "Name is required.").max(100, "Name must be at most 100 characters."),
});

export type TaxGroupFormValues = z.infer<typeof taxGroupFormSchema>;
