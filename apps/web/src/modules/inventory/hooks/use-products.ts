import { useQuery } from "@tanstack/react-query";
import type { ProductResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";

export function productsQueryKey(companyUuid?: string) {
  return ["inventory", "products", companyUuid ?? "all"] as const;
}

export function useProducts(companyUuid: string | null) {
  return useQuery<ProductResponseDto[], ApiError>({
    queryKey: productsQueryKey(companyUuid ?? undefined),
    queryFn: () => inventoryService.listProductsByCompany(companyUuid as string),
    enabled: Boolean(companyUuid),
  });
}
