import { useQuery } from "@tanstack/react-query";
import type { ProductCategoryResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";

export function productCategoryQueryKey(productCategoryUuid: string) {
  return ["inventory", "product-category", productCategoryUuid] as const;
}

export function useProductCategory(productCategoryUuid: string | null) {
  return useQuery<ProductCategoryResponseDto, ApiError>({
    queryKey: productCategoryQueryKey(productCategoryUuid ?? ""),
    queryFn: () => inventoryService.getProductCategory(productCategoryUuid as string),
    enabled: Boolean(productCategoryUuid),
  });
}
