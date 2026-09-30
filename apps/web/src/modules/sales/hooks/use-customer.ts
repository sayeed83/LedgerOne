import { useQuery } from "@tanstack/react-query";
import type { CustomerResponseDto } from "@ledgerone/shared-types";
import * as salesService from "@/services/sales.service";
import type { ApiError } from "@/services/api-client";

export function customerQueryKey(customerUuid: string) {
  return ["sales", "customer", customerUuid] as const;
}

export function useCustomer(customerUuid: string | null) {
  return useQuery<CustomerResponseDto, ApiError>({
    queryKey: customerQueryKey(customerUuid ?? ""),
    queryFn: () => salesService.getCustomer(customerUuid as string),
    enabled: Boolean(customerUuid),
  });
}
