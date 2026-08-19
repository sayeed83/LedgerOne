"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BatchStatus, type AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, Select, TextInput } from "@ledgerone/ui";
import { batchFormSchema, type BatchFormValues } from "../schemas/batch.schema";
import { CompanySelect } from "./CompanySelect";
import { BranchSelect } from "./BranchSelect";
import { WarehouseSelect } from "./WarehouseSelect";
import { ProductSelect } from "./ProductSelect";

export interface BatchFormProps {
  /** Scopes `BranchSelect`'s Company-filtered branch list — mirrors InventoryAdjustmentForm's own `companyUuid` prop. */
  companyUuid?: string;
  /** Prefills the `branchUuid` field (mirrors InventoryAdjustmentForm's own `branchUuid` prop) — scopes `WarehouseSelect`. */
  branchUuid?: string;
  defaultValues?: BatchFormValues;
  onSubmit: (values: BatchFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
  isEditing?: boolean;
}

const STATUS_OPTIONS = Object.values(BatchStatus).map((value) => ({ value, label: value }));

// Mirrors InventoryAdjustmentForm.tsx's exact pattern (its closest existing
// analog: a Company-scoped entity that also needs a Branch-scoped Warehouse
// picker dependency and a raw internal `productId`).
//
// `companyUuid`/`warehouseUuid`/`productId` are immutable on the backend's
// own `UpdateBatchProps` contract, so they are disabled once editing and
// never included in the update payload (see BatchDetailScreen.tsx's own
// `onSubmit`) — `batchNumber`/`manufactureDate`/`expiryDate`/`quantity`/
// `status` remain editable, mirroring the backend's own
// `update-batch.dto.ts` field list exactly. `productId` uses a plain
// numeric `TextInput`, not `ProductSelect`, for its actual submitted value
// — see ProductSelect.tsx's own header comment for the backend limitation
// that makes a Product-uuid-valued picker incompatible with this field
// (identical reasoning to InventoryAdjustmentForm's/StockForm's own
// `productId` treatment).
export function BatchForm({
  companyUuid,
  branchUuid,
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save",
  isEditing = false,
}: BatchFormProps) {
  const emptyValues: BatchFormValues = {
    companyUuid: companyUuid ?? "",
    branchUuid: branchUuid ?? "",
    warehouseUuid: "",
    productId: "",
    batchNumber: "",
    manufactureDate: "",
    expiryDate: "",
    quantity: "",
    status: BatchStatus.Active,
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors },
  } = useForm<BatchFormValues>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: defaultValues ?? emptyValues,
  });

  const selectedCompanyUuid = watch("companyUuid");
  const selectedBranchUuid = watch("branchUuid");

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof BatchFormValues;
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
          manufactureDate: values.manufactureDate || undefined,
          expiryDate: values.expiryDate || undefined,
          quantity: values.quantity || undefined,
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
      <TextInput label="Batch Number" error={errors.batchNumber?.message} {...register("batchNumber")} />
      <TextInput
        label="Manufacture Date (optional)"
        type="date"
        error={errors.manufactureDate?.message}
        {...register("manufactureDate")}
      />
      <TextInput
        label="Expiry Date (optional)"
        type="date"
        error={errors.expiryDate?.message}
        {...register("expiryDate")}
      />
      <TextInput label="Quantity (optional)" error={errors.quantity?.message} {...register("quantity")} />
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={field.value}
            onChange={field.onChange}
            error={errors.status?.message}
          />
        )}
      />
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        {submitLabel}
      </LoadingButton>
    </form>
  );
}
