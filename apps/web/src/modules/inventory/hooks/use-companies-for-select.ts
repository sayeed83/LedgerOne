import { useQuery } from "@tanstack/react-query";
import type { CompanyResponseDto } from "@ledgerone/shared-types";
import * as organizationService from "@/services/organization.service";
import { useCurrentTenant } from "@/hooks/use-current-tenant";

// ARCH-004: Inventory never imports from `modules/organization/*` — this
// reads the Organization module's own `services/organization.service.ts`
// (the sole API chokepoint, not a module-internal file), mirroring
// Accounting's own `use-companies-for-select.ts` exactly.
export function useCompaniesForSelect() {
  const { tenantUuid } = useCurrentTenant();
  return useQuery<CompanyResponseDto[]>({
    queryKey: ["organization", "companies", tenantUuid ?? ""],
    queryFn: () => organizationService.listCompaniesByTenant(tenantUuid as string),
    enabled: Boolean(tenantUuid),
  });
}
