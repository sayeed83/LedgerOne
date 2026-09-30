import { useQuery } from "@tanstack/react-query";
import type { CustomerResponseDto } from "@ledgerone/shared-types";
import * as salesService from "@/services/sales.service";
import type { ApiError } from "@/services/api-client";

// Customer exposes two distinct, equally-authorized list endpoints
// (`GET /customers` tenant-wide and `GET /customers/by-company?companyUuid=`
// Company-scoped — see the backend's own list-customers.controller.ts's/
// list-customers-by-company.controller.ts's header comments), so both hooks
// live in this one file rather than splitting into
// `use-customers-by-company.ts`, mirroring Reorder Level's own
// use-reorder-levels.ts exactly (inventory module).

export function customersQueryKey() {
  return ["sales", "customers"] as const;
}

export function useCustomers() {
  return useQuery<CustomerResponseDto[], ApiError>({
    queryKey: customersQueryKey(),
    queryFn: () => salesService.listCustomers(),
  });
}

export function customersByCompanyQueryKey(companyUuid?: string) {
  return ["sales", "customers", "by-company", companyUuid ?? "none"] as const;
}

export function useCustomersByCompany(companyUuid: string | null) {
  return useQuery<CustomerResponseDto[], ApiError>({
    queryKey: customersByCompanyQueryKey(companyUuid ?? undefined),
    queryFn: () => salesService.listCustomersByCompany(companyUuid as string),
    enabled: Boolean(companyUuid),
  });
}
