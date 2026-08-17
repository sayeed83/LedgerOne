import { useQuery } from "@tanstack/react-query";
import type { CompanyResponseDto } from "@ledgerone/shared-types";
import * as organizationService from "@/services/organization.service";
import type { ApiError } from "@/services/api-client";

export function companiesQueryKey(tenantUuid: string) {
  return ["organization", "companies", tenantUuid] as const;
}

// TBL-003: the backend returns a Tenant's Companies unpaginated (a
// documented small-dataset exception) — this hook simply fetches the whole
// list; search/filter/pagination are applied client-side by the screen.
export function useCompanies(tenantUuid: string | null) {
  return useQuery<CompanyResponseDto[], ApiError>({
    queryKey: companiesQueryKey(tenantUuid ?? ""),
    queryFn: () => organizationService.listCompaniesByTenant(tenantUuid as string),
    enabled: Boolean(tenantUuid),
  });
}
