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
import { useUnit } from "../hooks/use-unit";
import { useUpdateUnit } from "../hooks/use-update-unit";
import { UnitForm } from "../components/UnitForm";
import { getInventoryErrorMessage } from "../utils/inventory-error-messages";

// Mirrors Account Group's own AccountGroupDetailScreen.tsx pattern exactly.
export function UnitDetailScreen() {
  const router = useRouter();
  const params = useParams<{ unitUuid: string }>();
  const unitUuid = params.unitUuid;

  const unitQuery = useUnit(unitUuid);
  const companyUuid = unitQuery.data?.companyUuid ?? "";
  const updateUnit = useUpdateUnit(companyUuid, unitUuid);

  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Unit of Measure"
        description="Unit details."
        actions={
          <LoadingButton variant="ghost" size="sm" isLoading={false} onClick={() => router.push("/inventory/units")}>
            Back to Units of Measure
          </LoadingButton>
        }
      />

      {unitQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
          </CardContent>
        </Card>
      )}

      {unitQuery.isError && (
        <Alert variant="error" message={getInventoryErrorMessage(unitQuery.error) ?? "Failed to load Unit."} />
      )}

      {unitQuery.data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <ListIcon className="h-5 w-5" />
              </span>
              <CardTitle>{unitQuery.data.name}</CardTitle>
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
              <Field label="Symbol" value={unitQuery.data.symbol} />
              <Field label="Conversion Factor" value={unitQuery.data.conversionFactor ?? "—"} />
            </dl>
          </CardContent>
        </Card>
      )}

      <Drawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Unit"
        description="Update this Unit of Measure."
      >
        {unitQuery.data && (
          // Flagged known backend gap (see unit.dto.ts): the response
          // doesn't echo back `baseUnitUuid`, so this edit form can't
          // prefill it — mirrors Account Group's own identical,
          // already-documented gap in AccountGroupDetailScreen.tsx.
          <UnitForm
            isEditing
            excludeUnitUuid={unitUuid}
            defaultValues={{
              companyUuid: unitQuery.data.companyUuid,
              name: unitQuery.data.name,
              symbol: unitQuery.data.symbol,
              baseUnitUuid: "",
              conversionFactor: unitQuery.data.conversionFactor ?? "",
            }}
            isSubmitting={updateUnit.isPending}
            serverError={getInventoryErrorMessage(updateUnit.error)}
            fieldErrors={updateUnit.error?.details}
            onSubmit={(values) =>
              updateUnit.mutate(
                {
                  name: values.name,
                  symbol: values.symbol,
                  baseUnitUuid: values.baseUnitUuid || null,
                  conversionFactor: values.conversionFactor || null,
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
