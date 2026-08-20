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
import { useCurrentCompany } from "@/hooks/use-current-company";
import { useWarehouse } from "../hooks/use-warehouse";
import { useUpdateWarehouse } from "../hooks/use-update-warehouse";
import { WarehouseForm } from "../components/WarehouseForm";
import { getInventoryErrorMessage } from "../utils/inventory-error-messages";

// Mirrors ProductDetailScreen.tsx's exact pattern.
export function WarehouseDetailScreen() {
  const router = useRouter();
  const params = useParams<{ warehouseUuid: string }>();
  const warehouseUuid = params.warehouseUuid;

  const warehouseQuery = useWarehouse(warehouseUuid);
  // Flagged known backend gap (see warehouse.dto.ts/branch.dto.ts): neither
  // `WarehouseResponseDto` nor `BranchResponseDto` echoes back a
  // `companyUuid`, so this screen cannot derive the Warehouse's actual
  // Company from the API response the way ProductDetailScreen derives
  // `companyUuid` from its own response. Falls back to the globally active
  // Company context (`useCurrentCompany`) purely to scope the edit form's
  // (disabled) `BranchSelect` fetch — if the operator's active Company
  // differs from the Warehouse's real one, the selector won't resolve a
  // label for the immutable `branchUuid`, though the underlying value is
  // never altered (`branchUuid` isn't part of `UpdateWarehouseRequestDto`).
  const { companyUuid } = useCurrentCompany();
  const updateWarehouse = useUpdateWarehouse(warehouseQuery.data?.branchUuid ?? "", warehouseUuid);

  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Warehouse"
        description="Warehouse details."
        actions={
          <LoadingButton
            variant="ghost"
            size="sm"
            isLoading={false}
            onClick={() => router.push("/inventory/warehouses")}
          >
            Back to Warehouses
          </LoadingButton>
        }
      />

      {warehouseQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
          </CardContent>
        </Card>
      )}

      {warehouseQuery.isError && (
        <Alert variant="error" message={getInventoryErrorMessage(warehouseQuery.error) ?? "Failed to load Warehouse."} />
      )}

      {warehouseQuery.data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <ListIcon className="h-5 w-5" />
              </span>
              <CardTitle>
                {warehouseQuery.data.warehouseCode} — {warehouseQuery.data.name}
              </CardTitle>
              <StatusBadge status={warehouseQuery.data.status} />
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
              <Field label="Description" value={warehouseQuery.data.description ?? "—"} />
            </dl>
          </CardContent>
        </Card>
      )}

      <Drawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Warehouse"
        description="Update this Warehouse."
      >
        {warehouseQuery.data && (
          <WarehouseForm
            isEditing
            companyUuid={companyUuid ?? ""}
            defaultValues={{
              branchUuid: warehouseQuery.data.branchUuid,
              warehouseCode: warehouseQuery.data.warehouseCode,
              name: warehouseQuery.data.name,
              description: warehouseQuery.data.description ?? "",
              status: warehouseQuery.data.status,
            }}
            isSubmitting={updateWarehouse.isPending}
            serverError={getInventoryErrorMessage(updateWarehouse.error)}
            fieldErrors={updateWarehouse.error?.details}
            onSubmit={(values) =>
              updateWarehouse.mutate(
                {
                  name: values.name,
                  description: values.description || null,
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
