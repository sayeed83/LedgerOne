"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Drawer,
  ListIcon,
  LoadingButton,
  PencilIcon,
  Skeleton,
} from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { useProductCategory } from "../hooks/use-product-category";
import { useUpdateProductCategory } from "../hooks/use-update-product-category";
import { ProductCategoryForm } from "../components/ProductCategoryForm";
import { getInventoryErrorMessage } from "../utils/inventory-error-messages";

// Mirrors UnitDetailScreen.tsx's exact pattern.
export function ProductCategoryDetailScreen() {
  const router = useRouter();
  const params = useParams<{ productCategoryUuid: string }>();
  const productCategoryUuid = params.productCategoryUuid;

  const productCategoryQuery = useProductCategory(productCategoryUuid);
  const companyUuid = productCategoryQuery.data?.companyUuid ?? "";
  const updateProductCategory = useUpdateProductCategory(companyUuid, productCategoryUuid);

  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Product Category"
        description="Product Category details."
        actions={
          <LoadingButton
            variant="ghost"
            size="sm"
            isLoading={false}
            onClick={() => router.push("/inventory/product-categories")}
          >
            Back to Product Categories
          </LoadingButton>
        }
      />

      {productCategoryQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
          </CardContent>
        </Card>
      )}

      {productCategoryQuery.isError && (
        <Alert
          variant="error"
          message={getInventoryErrorMessage(productCategoryQuery.error) ?? "Failed to load Product Category."}
        />
      )}

      {productCategoryQuery.data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <ListIcon className="h-5 w-5" />
              </span>
              <CardTitle>{productCategoryQuery.data.name}</CardTitle>
            </div>
            <LoadingButton
              variant="secondary"
              size="sm"
              isLoading={false}
              leadingIcon={<PencilIcon className="h-4 w-4" />}
              onClick={() => setIsEditOpen(true)}
            >
              Edit
            </LoadingButton>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Default Tax Group" value={productCategoryQuery.data.defaultTaxGroupUuid ?? "—"} />
            </dl>
          </CardContent>
        </Card>
      )}

      <Drawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Product Category"
        description="Update this Product Category."
      >
        {productCategoryQuery.data && (
          // Flagged known backend gap (see product-category.dto.ts): the
          // response doesn't echo back `parentProductCategoryUuid`, so this
          // edit form can't prefill it — mirrors Unit's own identical,
          // already-documented gap in UnitDetailScreen.tsx.
          <ProductCategoryForm
            isEditing
            excludeProductCategoryUuid={productCategoryUuid}
            defaultValues={{
              companyUuid: productCategoryQuery.data.companyUuid,
              name: productCategoryQuery.data.name,
              parentProductCategoryUuid: "",
              defaultTaxGroupUuid: productCategoryQuery.data.defaultTaxGroupUuid ?? "",
            }}
            isSubmitting={updateProductCategory.isPending}
            serverError={getInventoryErrorMessage(updateProductCategory.error)}
            fieldErrors={updateProductCategory.error?.details}
            onSubmit={(values) =>
              updateProductCategory.mutate(
                {
                  name: values.name,
                  parentProductCategoryUuid: values.parentProductCategoryUuid || null,
                  defaultTaxGroupUuid: values.defaultTaxGroupUuid || null,
                },
                { onSuccess: () => setIsEditOpen(false) },
              )
            }
          />
        )}
      </Drawer>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted light:text-light-ink-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink light:text-light-ink">{value}</dd>
    </div>
  );
}
