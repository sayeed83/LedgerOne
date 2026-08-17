import { useQuery } from "@tanstack/react-query";
import type { DepartmentResponseDto } from "@ledgerone/shared-types";
import * as organizationService from "@/services/organization.service";
import type { ApiError } from "@/services/api-client";

export function departmentsQueryKey(companyUuid: string) {
  return ["organization", "departments", companyUuid] as const;
}

export function useDepartments(tenantUuid: string | null, companyUuid: string | null) {
  return useQuery<DepartmentResponseDto[], ApiError>({
    queryKey: departmentsQueryKey(companyUuid ?? ""),
    queryFn: () => organizationService.listDepartmentsByCompany(tenantUuid as string, companyUuid as string),
    enabled: Boolean(tenantUuid) && Boolean(companyUuid),
  });
}
