import { useQuery } from "@tanstack/react-query";
import type { DepartmentResponseDto } from "@ledgerone/shared-types";
import * as organizationService from "@/services/organization.service";
import type { ApiError } from "@/services/api-client";

export function departmentQueryKey(departmentUuid: string) {
  return ["organization", "department", departmentUuid] as const;
}

export function useDepartment(tenantUuid: string | null, departmentUuid: string | null) {
  return useQuery<DepartmentResponseDto, ApiError>({
    queryKey: departmentQueryKey(departmentUuid ?? ""),
    queryFn: () => organizationService.getDepartment(tenantUuid as string, departmentUuid as string),
    enabled: Boolean(tenantUuid) && Boolean(departmentUuid),
  });
}
