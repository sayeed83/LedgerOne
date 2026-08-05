// Re-exports Domain-owned enums through the Business layer's public
// surface, same seam as accounting-errors.ts. 04_FOLDER_STRUCTURE.md
// §19.3 / 05_CODING_STANDARDS.md Ch.9.3: `presentation/` may import
// `business/` only, never `domain/` directly — a Presentation-layer Zod
// schema that needs to validate against this enum's exact values (e.g.
// `z.nativeEnum(...)`) imports it from here.
export { FinancialYearStatus } from "../domain/enums/financial-year-status.enum";
export { FiscalPeriodStatus } from "../domain/enums/fiscal-period-status.enum";
export { CurrencyStatus } from "../domain/enums/currency-status.enum";
export { AccountType } from "../domain/enums/account-type.enum";
export { AccountStatus } from "../domain/enums/account-status.enum";
export { DecimalValue } from "../domain/value-objects/decimal-value.value-object";
