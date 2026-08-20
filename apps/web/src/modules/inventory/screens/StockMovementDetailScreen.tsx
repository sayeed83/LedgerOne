"use client";

import { useParams, useRouter } from "next/navigation";
import { Alert, Card, CardContent, CardHeader, CardTitle, ListIcon, LoadingButton, Skeleton } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { useStockMovement } from "../hooks/use-stock-movement";
import { getInventoryErrorMessage } from "../utils/inventory-error-messages";

// Mirrors InventoryAdjustmentDetailScreen.tsx's/StockDetailScreen.tsx's
// layout exactly, but READ-ONLY ONLY — Stock Movement is an immutable
// ledger entity (00_BUSINESS_RULES.md Ch.39.5/STM-002), and the backend has
// no update endpoint at all, so unlike those two screens this one has no
// Edit button, no edit `Drawer`, and no `useUpdateStockMovement` hook (it
// does not exist — there is nothing to update).
export function StockMovementDetailScreen() {
  const router = useRouter();
  const params = useParams<{ movementUuid: string }>();
  const movementUuid = params.movementUuid;

  const movementQuery = useStockMovement(movementUuid);

  return (
    <div>
      <PageHeader
        title="Stock Movement"
        description="Stock Movement details — an immutable ledger record."
        actions={
          <LoadingButton
            variant="ghost"
            size="sm"
            isLoading={false}
            onClick={() => router.push("/inventory/stock-movements")}
          >
            Back to Stock Movements
          </LoadingButton>
        }
      />

      {movementQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
          </CardContent>
        </Card>
      )}

      {movementQuery.isError && (
        <Alert
          variant="error"
          message={getInventoryErrorMessage(movementQuery.error) ?? "Failed to load Stock Movement."}
        />
      )}

      {movementQuery.data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <ListIcon className="h-5 w-5" />
              </span>
              <CardTitle>Product {movementQuery.data.productId}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Movement Type" value={movementQuery.data.movementType} />
              <Field label="Quantity" value={movementQuery.data.quantity} />
              <Field label="Company" value={movementQuery.data.companyUuid} />
              <Field label="Source Warehouse" value={movementQuery.data.sourceWarehouseUuid ?? "—"} />
              <Field label="Destination Warehouse" value={movementQuery.data.destinationWarehouseUuid ?? "—"} />
              <Field label="Reference Type" value={movementQuery.data.referenceType ?? "—"} />
              <Field label="Reference UUID" value={movementQuery.data.referenceUuid ?? "—"} />
              <Field label="Created At" value={new Date(movementQuery.data.createdAt).toLocaleString()} />
            </dl>
          </CardContent>
        </Card>
      )}
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
