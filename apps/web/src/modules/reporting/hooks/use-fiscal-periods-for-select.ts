import { useQuery } from "@tanstack/react-query";
import type { FiscalPeriodResponseDto } from "@ledgerone/shared-types";
import * as accountingService from "@/services/accounting.service";

// ARCH-004: reads Accounting's own `services/accounting.service.ts`
// directly, mirroring `use-financial-years-for-select.ts`'s own
// cross-module pattern. Fiscal Period is scoped to one Financial Year, not
// a Company — mirrors `listFiscalPeriods`'s own required-parent shape.
export function useFiscalPeriodsForSelect(financialYearUuid: string | null) {
  return useQuery<FiscalPeriodResponseDto[]>({
    queryKey: ["reporting", "fiscal-periods", financialYearUuid ?? ""],
    queryFn: () => accountingService.listFiscalPeriods(financialYearUuid as string),
    enabled: Boolean(financialYearUuid),
  });
}
