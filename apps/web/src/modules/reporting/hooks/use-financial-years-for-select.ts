import { useQuery } from "@tanstack/react-query";
import type { FinancialYearResponseDto } from "@ledgerone/shared-types";
import * as accountingService from "@/services/accounting.service";

// ARCH-004: Reporting never imports from `modules/accounting/*` — this
// reads the Accounting module's own `services/accounting.service.ts` (the
// sole API chokepoint, not a module-internal file) directly, mirroring
// `use-companies-for-select.ts`'s own cross-module pattern. Exists only to
// back the Financial Year/Fiscal Period scope pickers each report's own
// filter bar offers (00_BUSINESS_RULES.md Ch.81.8) — Reporting has no
// Financial Year CRUD of its own.
export function useFinancialYearsForSelect(companyUuid: string | null) {
  return useQuery<FinancialYearResponseDto[]>({
    queryKey: ["reporting", "financial-years", companyUuid ?? "all"],
    queryFn: () => accountingService.listFinancialYears(companyUuid ?? undefined),
    enabled: Boolean(companyUuid),
  });
}
