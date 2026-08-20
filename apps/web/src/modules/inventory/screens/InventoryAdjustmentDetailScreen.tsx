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
import { useInventoryAdjustment } from "../hooks/use-inventory-adjustment";
import { useUpdateInventoryAdjustment } from "../hooks/use-update-inventory-adjustment";
import { InventoryAdjustmentForm } from "../components/InventoryAdjustmentForm";
import { getInventoryErrorMessage } from "../utils/inventory-error-messages";

// Mirrors StockDetailScreen.tsx's exact pattern.
export function InventoryAdjustmentDetailScreen() {
  const router = useRouter();
  const params = useParams<{ adjustmentUuid: string }>();
  const adjustmentUuid = params.adjustmentUuid;

  const adjustmentQuery = useInventoryAdjustment(adjustmentUuid);
  // Flagged known backend gap (see inventory-adjustment.dto.ts/warehouse.dto.ts):
  // neither `InventoryAdjustmentResponseDto` nor `WarehouseResponseDto`
  // echoes back the owning Warehouse's `branchUuid`, so this screen cannot
  // derive it the way `ProductDetailScreen` derives `companyUuid` from its
  // own response — mirrors `StockDetailScreen`'s own identical, already-
  // documented gap for `BranchSelect`. `companyUuid`/`warehouseUuid`/
  // `productId`/`adjustmentType` are disabled on the edit form regardless
  // (see InventoryAdjustmentForm.tsx's own header comment), so the
  // unresolved Branch only affects whether `WarehouseSelect` can render a
  // friendly label for the existing (immutable-in-effect) `warehouseUuid` —
  // the underlying value itself is never altered.
  const updateInventoryAdjustment = useUpdateInventoryAdjustment(
    adjustmentQuery.data?.warehouseUuid ?? "",
    adjustmentUuid,
  );

  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Inventory Adjustment"
        description="Inventory Adjustment details."
        actions={
          <LoadingButton
            variant="ghost"
            size="sm"
            isLoading={false}
            onClick={() => router.push("/inventory/adjustments")}
          >
            Back to Inventory Adjustments
          </LoadingButton>
        }
      />

      {adjustmentQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
          </CardContent>
        </Card>
      )}

      {adjustmentQuery.isError && (
        <Alert
          variant="error"
          message={getInventoryErrorMessage(adjustmentQuery.error) ?? "Failed to load Inventory Adjustment."}
        />
      )}

      {adjustmentQuery.data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <ListIcon className="h-5 w-5" />
              </span>
              <CardTitle>Product {adjustmentQuery.data.productId}</CardTitle>
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
              <Field label="Adjustment Type" value={adjustmentQuery.data.adjustmentType} />
              <Field label="Quantity" value={adjustmentQuery.data.quantity} />
              <Field label="Reason" value={adjustmentQuery.data.reason} />
              <Field label="Remarks" value={adjustmentQuery.data.remarks ?? "—"} />
            </dl>
          </CardContent>
        </Card>
      )}

      <Drawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Inventory Adjustment"
        description="Update this Inventory Adjustment's quantity, reason, and remarks."
      >
        {adjustmentQuery.data && (
          <InventoryAdjustmentForm
            isEditing
            companyUuid={adjustmentQuery.data.companyUuid}
            defaultValues={{
              companyUuid: adjustmentQuery.data.companyUuid,
              branchUuid: "",
              warehouseUuid: adjustmentQuery.data.warehouseUuid,
              productId: adjustmentQuery.data.productId,
              adjustmentType: adjustmentQuery.data.adjustmentType,
              quantity: adjustmentQuery.data.quantity,
              reason: adjustmentQuery.data.reason,
              remarks: adjustmentQuery.data.remarks ?? "",
            }}
            isSubmitting={updateInventoryAdjustment.isPending}
            serverError={getInventoryErrorMessage(updateInventoryAdjustment.error)}
            fieldErrors={updateInventoryAdjustment.error?.details}
            onSubmit={(values) =>
              updateInventoryAdjustment.mutate(
                {
                  quantity: values.quantity,
                  reason: values.reason,
                  remarks: values.remarks || null,
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
