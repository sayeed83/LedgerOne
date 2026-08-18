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
import { useStock } from "../hooks/use-stock";
import { useUpdateStock } from "../hooks/use-update-stock";
import { StockForm } from "../components/StockForm";
import { getInventoryErrorMessage } from "../utils/inventory-error-messages";

// Mirrors WarehouseDetailScreen.tsx's exact pattern.
export function StockDetailScreen() {
  const router = useRouter();
  const params = useParams<{ stockUuid: string }>();
  const stockUuid = params.stockUuid;

  const stockQuery = useStock(stockUuid);
  // Flagged known backend gap (see stock.dto.ts/warehouse.dto.ts): neither
  // `StockResponseDto` nor `WarehouseResponseDto` echoes back the owning
  // Warehouse's `branchUuid`, so this screen cannot derive it the way
  // `ProductDetailScreen` derives `companyUuid` from its own response —
  // mirrors `WarehouseDetailScreen`'s own identical, already-documented gap
  // for `BranchSelect`. `warehouseUuid`/`productId` are disabled on the edit
  // form regardless (see StockForm.tsx's own header comment), so the
  // unresolved Branch only affects whether `WarehouseSelect` can render a
  // friendly label for the existing (immutable-in-effect) `warehouseUuid` —
  // the underlying value itself is never altered.
  const updateStock = useUpdateStock(stockQuery.data?.warehouseUuid ?? "", stockUuid);

  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Stock"
        description="Stock details."
        actions={
          <LoadingButton variant="ghost" size="sm" isLoading={false} onClick={() => router.push("/inventory/stocks")}>
            Back to Stock
          </LoadingButton>
        }
      />

      {stockQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
          </CardContent>
        </Card>
      )}

      {stockQuery.isError && (
        <Alert variant="error" message={getInventoryErrorMessage(stockQuery.error) ?? "Failed to load Stock."} />
      )}

      {stockQuery.data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <ListIcon className="h-5 w-5" />
              </span>
              <CardTitle>Product {stockQuery.data.productId}</CardTitle>
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
              <Field label="Quantity On Hand" value={stockQuery.data.quantityOnHand} />
              <Field label="Quantity Reserved" value={stockQuery.data.quantityReserved} />
              <Field label="Quantity Available" value={stockQuery.data.quantityAvailable} />
            </dl>
          </CardContent>
        </Card>
      )}

      <Drawer isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Stock" description="Update this Stock's quantities.">
        {stockQuery.data && (
          <StockForm
            isEditing
            companyUuid={stockQuery.data.companyUuid}
            defaultValues={{
              companyUuid: stockQuery.data.companyUuid,
              branchUuid: "",
              warehouseUuid: stockQuery.data.warehouseUuid,
              productId: stockQuery.data.productId,
              quantityOnHand: stockQuery.data.quantityOnHand,
              quantityReserved: stockQuery.data.quantityReserved,
              quantityAvailable: stockQuery.data.quantityAvailable,
            }}
            isSubmitting={updateStock.isPending}
            serverError={getInventoryErrorMessage(updateStock.error)}
            fieldErrors={updateStock.error?.details}
            onSubmit={(values) =>
              updateStock.mutate(
                {
                  quantityOnHand: values.quantityOnHand,
                  quantityReserved: values.quantityReserved,
                  quantityAvailable: values.quantityAvailable,
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
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value}</dd>
    </div>
  );
}
