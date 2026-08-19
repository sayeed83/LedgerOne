"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdjustmentType, type AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, Select, Textarea, TextInput } from "@ledgerone/ui";
import { inventoryAdjustmentFormSchema, type InventoryAdjustmentFormValues } from "../schemas/inventory-adjustment.schema";
import { CompanySelect } from "./CompanySelect";
import { BranchSelect } from "./BranchSelect";
import { WarehouseSelect } from "./WarehouseSelect";
import { ProductSelect } from "./ProductSelect";

export interface InventoryAdjustmentFormProps {
  /** Scopes `BranchSelect`'s Company-filtered branch list — mirrors StockForm's own `companyUuid` prop. */
  companyUuid?: string;
  /** Prefills the `branchUuid` field (mirrors StockForm's own `branchUuid` prop) — scopes `WarehouseSelect`. */
  branchUuid?: string;
  defaultValues?: InventoryAdjustmentFormValues;
  onSubmit: (values: InventoryAdjustmentFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
  isEditing?: boolean;
}

const ADJUSTMENT_TYPE_OPTIONS = Object.values(AdjustmentType).map((value) => ({ value, label: value }));

// Mirrors StockForm.tsx's exact pattern (its closest existing analog: a
// Company-scoped entity that also needs a Branch-scoped Warehouse picker
// dependency and a raw internal `productId`).
//
// `companyUuid`/`warehouseUuid`/`productId`/`adjustmentType` are disabled
// once editing and never included in the update payload (see
// InventoryAdjustmentDetailScreen.tsx's own `onSubmit`) — the backend's own
// `update-inventory-adjustment.dto.ts` accepts only `quantity`/`reason`/
// `remarks` (already flagged at the Presentation milestone; see that DTO's
// own header comment), so presenting the other fields as editable-and-
// effective on this screen would mislead the operator. `productId` uses a
// plain numeric `TextInput`, not `ProductSelect`, for its actual submitted
// value — see ProductSelect.tsx's own header comment for the backend
// limitation that makes a Product-uuid-valued picker incompatible with this
// field (identical reasoning to StockForm's own `productId` treatment).
export function InventoryAdjustmentForm({
  companyUuid,
  branchUuid,
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save",
  isEditing = false,
}: InventoryAdjustmentFormProps) {
  const emptyValues: InventoryAdjustmentFormValues = {
    companyUuid: companyUuid ?? "",
    branchUuid: branchUuid ?? "",
    warehouseUuid: "",
    productId: "",
    adjustmentType: AdjustmentType.Increase,
    quantity: "",
    reason: "",
    remarks: "",
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors },
  } = useForm<InventoryAdjustmentFormValues>({
    resolver: zodResolver(inventoryAdjustmentFormSchema),
    defaultValues: defaultValues ?? emptyValues,
  });

  const selectedCompanyUuid = watch("companyUuid");
  const selectedBranchUuid = watch("branchUuid");

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof InventoryAdjustmentFormValues;
      if (field in emptyValues) {
        setError(field, { type: "server", message: detail.message });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldErrors, setError]);

  return (
    <form
      onSubmit={handleSubmit((values) =>
        onSubmit({
          ...values,
          remarks: values.remarks || undefined,
        }),
      )}
      className="flex flex-col gap-5"
      noValidate
    >
      <ErrorAlert message={serverError} />
      {isEditing || companyUuid ? (
        <input type="hidden" {...register("companyUuid")} />
      ) : (
        <Controller
          name="companyUuid"
          control={control}
          render={({ field }) => (
            <CompanySelect value={field.value} onChange={field.onChange} error={errors.companyUuid?.message} />
          )}
        />
      )}
      <Controller
        name="branchUuid"
        control={control}
        render={({ field }) => (
          <BranchSelect
            companyUuid={selectedCompanyUuid}
            value={field.value}
            onChange={field.onChange}
            error={errors.branchUuid?.message}
            disabled={isEditing}
          />
        )}
      />
      <Controller
        name="warehouseUuid"
        control={control}
        render={({ field }) => (
          <WarehouseSelect
            branchUuid={selectedBranchUuid}
            value={field.value}
            onChange={field.onChange}
            error={errors.warehouseUuid?.message}
            disabled={isEditing}
          />
        )}
      />
      <TextInput
        label="Product ID"
        hint="The Product's internal identifier (not its Product Code)."
        disabled={isEditing}
        error={errors.productId?.message}
        {...register("productId")}
      />
      {!isEditing && (
        <ProductSelect
          companyUuid={selectedCompanyUuid}
          value=""
          onChange={() => {
            /* Look-up aid only — see ProductSelect.tsx's own header comment for why its uuid-valued selection cannot populate the Product ID field above. */
          }}
        />
      )}
      <Controller
        name="adjustmentType"
        control={control}
        render={({ field }) => (
          <Select
            label="Adjustment Type"
            options={ADJUSTMENT_TYPE_OPTIONS}
            value={field.value}
            onChange={field.onChange}
            error={errors.adjustmentType?.message}
            disabled={isEditing}
          />
        )}
      />
      <TextInput label="Quantity" error={errors.quantity?.message} {...register("quantity")} />
      <TextInput label="Reason" error={errors.reason?.message} {...register("reason")} />
      <Textarea label="Remarks (optional)" error={errors.remarks?.message} {...register("remarks")} />
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        {submitLabel}
      </LoadingButton>
    </form>
  );
}
