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
import { useReorderLevel } from "../hooks/use-reorder-level";
import { useUpdateReorderLevel } from "../hooks/use-update-reorder-level";
import { ReorderLevelForm } from "../components/ReorderLevelForm";
import { getInventoryErrorMessage } from "../utils/inventory-error-messages";

// Mirrors BatchDetailScreen.tsx's exact pattern.
export function ReorderLevelDetailScreen() {
  const router = useRouter();
  const params = useParams<{ reorderLevelUuid: string }>();
  const reorderLevelUuid = params.reorderLevelUuid;

  const reorderLevelQuery = useReorderLevel(reorderLevelUuid);
  // Flagged known backend gap (see reorder-level.dto.ts/warehouse.dto.ts):
  // neither `ReorderLevelResponseDto` nor `WarehouseResponseDto` echoes back
  // the owning Warehouse's `branchUuid`, so this screen cannot derive it the
  // way `ProductDetailScreen` derives `companyUuid` from its own response —
  // mirrors `BatchDetailScreen`'s/`InventoryAdjustmentDetailScreen`'s own
  // identical, already-documented gap for `BranchSelect`. `companyUuid`/
  // `warehouseUuid`/`productId` are disabled on the edit form regardless (see
  // ReorderLevelForm.tsx's own header comment), so the unresolved Branch only
  // affects whether `WarehouseSelect` can render a friendly label for the
  // existing (immutable-in-effect) `warehouseUuid` — the underlying value
  // itself is never altered.
  const updateReorderLevel = useUpdateReorderLevel(
    reorderLevelQuery.data?.companyUuid ?? "",
    reorderLevelQuery.data?.warehouseUuid ?? "",
    reorderLevelUuid,
  );

  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Reorder Level"
        description="Reorder Level details."
        actions={
          <LoadingButton
            variant="ghost"
            size="sm"
            isLoading={false}
            onClick={() => router.push("/inventory/reorder-levels")}
          >
            Back to Reorder Levels
          </LoadingButton>
        }
      />

      {reorderLevelQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
          </CardContent>
        </Card>
      )}

      {reorderLevelQuery.isError && (
        <Alert
          variant="error"
          message={getInventoryErrorMessage(reorderLevelQuery.error) ?? "Failed to load Reorder Level."}
        />
      )}

      {reorderLevelQuery.data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <ListIcon className="h-5 w-5" />
              </span>
              <CardTitle>Product {reorderLevelQuery.data.productId}</CardTitle>
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
              <Field label="Company" value={reorderLevelQuery.data.companyUuid} />
              <Field label="Warehouse" value={reorderLevelQuery.data.warehouseUuid} />
              <Field label="Product" value={reorderLevelQuery.data.productId} />
              <Field label="Reorder Level" value={reorderLevelQuery.data.reorderLevel} />
              <Field label="Reorder Quantity" value={reorderLevelQuery.data.reorderQuantity} />
            </dl>
          </CardContent>
        </Card>
      )}

      <Drawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Reorder Level"
        description="Update this Reorder Level's own Reorder Level/Reorder Quantity thresholds."
      >
        {reorderLevelQuery.data && (
          <ReorderLevelForm
            isEditing
            companyUuid={reorderLevelQuery.data.companyUuid}
            defaultValues={{
              companyUuid: reorderLevelQuery.data.companyUuid,
              branchUuid: "",
              warehouseUuid: reorderLevelQuery.data.warehouseUuid,
              productId: reorderLevelQuery.data.productId,
              reorderLevel: reorderLevelQuery.data.reorderLevel,
              reorderQuantity: reorderLevelQuery.data.reorderQuantity,
            }}
            isSubmitting={updateReorderLevel.isPending}
            serverError={getInventoryErrorMessage(updateReorderLevel.error)}
            fieldErrors={updateReorderLevel.error?.details}
            onSubmit={(values) =>
              updateReorderLevel.mutate(
                {
                  reorderLevel: values.reorderLevel,
                  reorderQuantity: values.reorderQuantity,
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
