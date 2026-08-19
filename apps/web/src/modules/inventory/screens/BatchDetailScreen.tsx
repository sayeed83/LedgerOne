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
import { useBatch } from "../hooks/use-batch";
import { useUpdateBatch } from "../hooks/use-update-batch";
import { BatchForm } from "../components/BatchForm";
import { getInventoryErrorMessage } from "../utils/inventory-error-messages";

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

// Mirrors InventoryAdjustmentDetailScreen.tsx's exact pattern.
export function BatchDetailScreen() {
  const router = useRouter();
  const params = useParams<{ batchUuid: string }>();
  const batchUuid = params.batchUuid;

  const batchQuery = useBatch(batchUuid);
  // Flagged known backend gap (see batch.dto.ts/warehouse.dto.ts): neither
  // `BatchResponseDto` nor `WarehouseResponseDto` echoes back the owning
  // Warehouse's `branchUuid`, so this screen cannot derive it the way
  // `ProductDetailScreen` derives `companyUuid` from its own response —
  // mirrors `InventoryAdjustmentDetailScreen`'s/`StockDetailScreen`'s own
  // identical, already-documented gap for `BranchSelect`. `companyUuid`/
  // `warehouseUuid`/`productId` are disabled on the edit form regardless
  // (see BatchForm.tsx's own header comment), so the unresolved Branch only
  // affects whether `WarehouseSelect` can render a friendly label for the
  // existing (immutable-in-effect) `warehouseUuid` — the underlying value
  // itself is never altered.
  const updateBatch = useUpdateBatch(batchQuery.data?.warehouseUuid ?? "", batchUuid);

  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Batch"
        description="Batch/Lot details."
        actions={
          <LoadingButton variant="ghost" size="sm" isLoading={false} onClick={() => router.push("/inventory/batches")}>
            Back to Batches
          </LoadingButton>
        }
      />

      {batchQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
          </CardContent>
        </Card>
      )}

      {batchQuery.isError && (
        <Alert variant="error" message={getInventoryErrorMessage(batchQuery.error) ?? "Failed to load Batch."} />
      )}

      {batchQuery.data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <ListIcon className="h-5 w-5" />
              </span>
              <CardTitle>{batchQuery.data.batchNumber}</CardTitle>
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
              <Field label="Product" value={batchQuery.data.productId} />
              <Field label="Manufacture Date" value={formatDate(batchQuery.data.manufactureDate)} />
              <Field label="Expiry Date" value={formatDate(batchQuery.data.expiryDate)} />
              <Field label="Quantity" value={batchQuery.data.quantity} />
              <Field label="Status" value={batchQuery.data.status} />
            </dl>
          </CardContent>
        </Card>
      )}

      <Drawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Batch"
        description="Update this Batch's number, manufacture/expiry dates, quantity, and status."
      >
        {batchQuery.data && (
          <BatchForm
            isEditing
            companyUuid={batchQuery.data.companyUuid}
            defaultValues={{
              companyUuid: batchQuery.data.companyUuid,
              branchUuid: "",
              warehouseUuid: batchQuery.data.warehouseUuid,
              productId: batchQuery.data.productId,
              batchNumber: batchQuery.data.batchNumber,
              manufactureDate: batchQuery.data.manufactureDate ? batchQuery.data.manufactureDate.slice(0, 10) : "",
              expiryDate: batchQuery.data.expiryDate ? batchQuery.data.expiryDate.slice(0, 10) : "",
              quantity: batchQuery.data.quantity,
              status: batchQuery.data.status,
            }}
            isSubmitting={updateBatch.isPending}
            serverError={getInventoryErrorMessage(updateBatch.error)}
            fieldErrors={updateBatch.error?.details}
            onSubmit={(values) =>
              updateBatch.mutate(
                {
                  batchNumber: values.batchNumber,
                  manufactureDate: values.manufactureDate || null,
                  expiryDate: values.expiryDate || null,
                  quantity: values.quantity,
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
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value}</dd>
    </div>
  );
}
