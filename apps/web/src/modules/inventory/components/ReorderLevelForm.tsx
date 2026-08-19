"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, TextInput } from "@ledgerone/ui";
import { reorderLevelFormSchema, type ReorderLevelFormValues } from "../schemas/reorder-level.schema";
import { CompanySelect } from "./CompanySelect";
import { BranchSelect } from "./BranchSelect";
import { WarehouseSelect } from "./WarehouseSelect";
import { ProductSelect } from "./ProductSelect";

export interface ReorderLevelFormProps {
  /** Scopes `BranchSelect`'s Company-filtered branch list — mirrors BatchForm's own `companyUuid` prop. */
  companyUuid?: string;
  /** Prefills the `branchUuid` field (mirrors BatchForm's own `branchUuid` prop) — scopes `WarehouseSelect`. */
  branchUuid?: string;
  defaultValues?: ReorderLevelFormValues;
  onSubmit: (values: ReorderLevelFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
  isEditing?: boolean;
}

// Mirrors BatchForm.tsx's exact pattern (its closest existing analog: a
// Company-scoped entity that also needs a Branch-scoped Warehouse picker
// dependency and a raw internal `productId`).
//
// `companyUuid`/`warehouseUuid`/`productId` are immutable on the backend's
// own `UpdateReorderLevelProps` contract (ROL-101's Warehouse/Product pair is
// only ever checked at create time), so they are disabled once editing and
// never included in the update payload (see ReorderLevelDetailScreen.tsx's
// own `onSubmit`) — `reorderLevel`/`reorderQuantity` remain editable,
// mirroring the backend's own `update-reorder-level.dto.ts` field list
// exactly. `productId` uses a plain numeric `TextInput`, not `ProductSelect`,
// for its actual submitted value — see ProductSelect.tsx's own header
// comment for the backend limitation that makes a Product-uuid-valued picker
// incompatible with this field (identical reasoning to BatchForm's/
// InventoryAdjustmentForm's own `productId` treatment).
export function ReorderLevelForm({
  companyUuid,
  branchUuid,
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save",
  isEditing = false,
}: ReorderLevelFormProps) {
  const emptyValues: ReorderLevelFormValues = {
    companyUuid: companyUuid ?? "",
    branchUuid: branchUuid ?? "",
    warehouseUuid: "",
    productId: "",
    reorderLevel: "",
    reorderQuantity: "",
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors },
  } = useForm<ReorderLevelFormValues>({
    resolver: zodResolver(reorderLevelFormSchema),
    defaultValues: defaultValues ?? emptyValues,
  });

  const selectedCompanyUuid = watch("companyUuid");
  const selectedBranchUuid = watch("branchUuid");

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof ReorderLevelFormValues;
      if (field in emptyValues) {
        setError(field, { type: "server", message: detail.message });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldErrors, setError]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
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
      <TextInput label="Reorder Level" error={errors.reorderLevel?.message} {...register("reorderLevel")} />
      <TextInput label="Reorder Quantity" error={errors.reorderQuantity?.message} {...register("reorderQuantity")} />
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        {submitLabel}
      </LoadingButton>
    </form>
  );
}
