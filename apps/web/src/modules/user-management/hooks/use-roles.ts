import { useQuery } from "@tanstack/react-query";
import type { RoleResponseDto } from "@ledgerone/shared-types";
import * as authorizationService from "@/services/authorization.service";
import type { ApiError } from "@/services/api-client";

export function useRoles() {
  return useQuery<RoleResponseDto[], ApiError>({
    queryKey: ["authorization", "roles"],
    queryFn: () => authorizationService.listRoles(),
  });
}
