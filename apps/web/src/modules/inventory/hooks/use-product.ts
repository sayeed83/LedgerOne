import { useQuery } from "@tanstack/react-query";
import type { ProductResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";

export function productQueryKey(productUuid: string) {
  return ["inventory", "product", productUuid] as const;
}

export function useProduct(productUuid: string | null) {
  return useQuery<ProductResponseDto, ApiError>({
    queryKey: productQueryKey(productUuid ?? ""),
    queryFn: () => inventoryService.getProduct(productUuid as string),
    enabled: Boolean(productUuid),
  });
}
