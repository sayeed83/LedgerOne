import { z } from "zod";

export const currencyFormSchema = z.object({
  isoCode: z
    .string()
    .length(3, "ISO code must be exactly 3 letters.")
    .regex(/^[A-Z]{3}$/, "ISO code must be 3 uppercase letters."),
  name: z.string().min(1, "Name is required.").max(100, "Name must be at most 100 characters."),
  symbol: z.string().min(1, "Symbol is required.").max(10, "Symbol must be at most 10 characters."),
  decimalPrecision: z.coerce.number().int().min(0, "Enter 0-255.").max(255, "Enter 0-255."),
});

export type CurrencyFormValues = z.infer<typeof currencyFormSchema>;
