import { useQuery } from "@tanstack/react-query";
import type { ProductCategoryResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";

// Minimal, read-only — exists only to back ProductCategorySelect. Product
// Category has no create/edit/list frontend of its own yet.
export function productCategoriesQueryKey(companyUuid?: string) {
  return ["inventory", "product-categories", companyUuid ?? "all"] as const;
}

export function useProductCategories(companyUuid: string | null) {
  return useQuery<ProductCategoryResponseDto[], ApiError>({
    queryKey: productCategoriesQueryKey(companyUuid ?? undefined),
    queryFn: () => inventoryService.listProductCategoriesByCompany(companyUuid as string),
    enabled: Boolean(companyUuid),
  });
}
