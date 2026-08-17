import { useQuery } from "@tanstack/react-query";
import type { CompanyResponseDto } from "@ledgerone/shared-types";
import * as organizationService from "@/services/organization.service";
import type { ApiError } from "@/services/api-client";

export function companyQueryKey(companyUuid: string) {
  return ["organization", "company", companyUuid] as const;
}

export function useCompany(tenantUuid: string | null, companyUuid: string | null) {
  return useQuery<CompanyResponseDto, ApiError>({
    queryKey: companyQueryKey(companyUuid ?? ""),
    queryFn: () => organizationService.getCompany(tenantUuid as string, companyUuid as string),
    enabled: Boolean(tenantUuid) && Boolean(companyUuid),
  });
}
