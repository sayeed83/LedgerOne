import { useMutation } from "@tanstack/react-query";
import type { CreateTenantRequestDto, TenantResponseDto } from "@ledgerone/shared-types";
import * as organizationService from "@/services/organization.service";
import type { ApiError } from "@/services/api-client";

export function useCreateTenant() {
  return useMutation<TenantResponseDto, ApiError, CreateTenantRequestDto>({
    mutationFn: (payload) => organizationService.createTenant(payload),
  });
}
