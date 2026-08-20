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
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useProduct } from "../hooks/use-product";
import { useUpdateProduct } from "../hooks/use-update-product";
import { ProductForm } from "../components/ProductForm";
import { getInventoryErrorMessage } from "../utils/inventory-error-messages";

// Mirrors UnitDetailScreen.tsx's exact pattern.
export function ProductDetailScreen() {
  const router = useRouter();
  const params = useParams<{ productUuid: string }>();
  const productUuid = params.productUuid;

  const productQuery = useProduct(productUuid);
  const companyUuid = productQuery.data?.companyUuid ?? "";
  const updateProduct = useUpdateProduct(companyUuid, productUuid);

  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Product"
        description="Product details."
        actions={
          <LoadingButton variant="ghost" size="sm" isLoading={false} onClick={() => router.push("/inventory/products")}>
            Back to Products
          </LoadingButton>
        }
      />

      {productQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
          </CardContent>
        </Card>
      )}

      {productQuery.isError && (
        <Alert variant="error" message={getInventoryErrorMessage(productQuery.error) ?? "Failed to load Product."} />
      )}

      {productQuery.data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <ListIcon className="h-5 w-5" />
              </span>
              <CardTitle>
                {productQuery.data.productCode} — {productQuery.data.name}
              </CardTitle>
              <StatusBadge status={productQuery.data.status} />
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
              <Field label="Description" value={productQuery.data.description ?? "—"} />
              <Field label="Stocked" value={productQuery.data.isStocked ? "Yes" : "No"} />
            </dl>
          </CardContent>
        </Card>
      )}

      <Drawer isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Product" description="Update this Product.">
        {productQuery.data && (
          // Flagged known backend gap (see product.dto.ts): the response
          // doesn't echo back `productCategoryUuid`/`unitUuid`, so this edit
          // form can't prefill them — mirrors Unit's/Account's own
          // identical, already-documented gap.
          <ProductForm
            isEditing
            companyUuid={productQuery.data.companyUuid}
            defaultValues={{
              companyUuid: productQuery.data.companyUuid,
              productCode: productQuery.data.productCode,
              name: productQuery.data.name,
              description: productQuery.data.description ?? "",
              productCategoryUuid: "",
              unitUuid: "",
              isStocked: productQuery.data.isStocked,
              status: productQuery.data.status,
            }}
            isSubmitting={updateProduct.isPending}
            serverError={getInventoryErrorMessage(updateProduct.error)}
            fieldErrors={updateProduct.error?.details}
            onSubmit={(values) =>
              updateProduct.mutate(
                {
                  name: values.name,
                  description: values.description || null,
                  productCategoryUuid: values.productCategoryUuid,
                  unitUuid: values.unitUuid || null,
                  isStocked: values.isStocked,
                  status: values.status,
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
