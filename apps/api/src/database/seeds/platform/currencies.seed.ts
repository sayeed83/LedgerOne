// Platform seed (04_FOLDER_STRUCTURE.md Ch.11.3) — a small set of commonly
// used ISO 4217 Currencies (00_BUSINESS_RULES.md Ch.7), platform-owned
// reference data (Ch.7.5) with no `tenantId`. Ships to every environment
// including production (Ch.11.6). Goes through the Business layer's
// `createCurrency` use case, never Prisma directly (05_CODING_STANDARDS.md
// Ch.9.5) — idempotent via `findCurrencyByIsoCode`, safe to re-run.
import { createAccountingDependencies } from "../../../shared/accounting/business/accounting.composition";
import { createCurrency } from "../../../shared/accounting/business/create-currency.service";

const CURRENCIES = [
  { isoCode: "USD", name: "US Dollar", symbol: "$", decimalPrecision: 2 },
  { isoCode: "EUR", name: "Euro", symbol: "€", decimalPrecision: 2 },
  { isoCode: "GBP", name: "British Pound", symbol: "£", decimalPrecision: 2 },
  { isoCode: "INR", name: "Indian Rupee", symbol: "₹", decimalPrecision: 2 },
  { isoCode: "JPY", name: "Japanese Yen", symbol: "¥", decimalPrecision: 0 },
];

export async function seed(): Promise<void> {
  const deps = createAccountingDependencies();

  for (const currency of CURRENCIES) {
    const existing = await deps.repository.findCurrencyByIsoCode(currency.isoCode);
    if (existing) {
      console.log(`Currency ${currency.isoCode} already exists, skipping.`);
      continue;
    }
    await createCurrency(currency, deps);
    console.log(`Seeded currency ${currency.isoCode}.`);
  }
}
