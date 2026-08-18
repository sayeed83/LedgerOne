"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, TextInput } from "@ledgerone/ui";
import { stockFormSchema, type StockFormValues } from "../schemas/stock.schema";
import { CompanySelect } from "./CompanySelect";
import { BranchSelect } from "./BranchSelect";
import { WarehouseSelect } from "./WarehouseSelect";
import { ProductSelect } from "./ProductSelect";

export interface StockFormProps {
  /** Scopes `BranchSelect`'s Company-filtered branch list — mirrors ProductForm's own `companyUuid` prop. */
  companyUuid?: string;
  /** Prefills the `branchUuid` field (mirrors WarehouseForm's own `branchUuid` prop) — scopes `WarehouseSelect`. */
  branchUuid?: string;
  defaultValues?: StockFormValues;
  onSubmit: (values: StockFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
  isEditing?: boolean;
}

// Mirrors ProductForm.tsx's/WarehouseForm.tsx's exact pattern (its closest
// existing analog: a Company-scoped entity that also needs a Branch-scoped
// picker dependency, combining both forms' own scoping shapes since Stock
// carries a real `companyUuid` field like Product, but references a
// Branch-owned Warehouse like Warehouse's own `branchUuid`).
//
// `warehouseUuid`/`productId` are disabled once editing and never included
// in the update payload (see StockDetailScreen.tsx's own `onSubmit`) — the
// backend's `update-stock.service.ts` accepts them only to re-validate
// STK-003 uniqueness, but never actually persists a Warehouse/Product move
// (already flagged at the Business milestone; see that service's own header
// comment), so presenting them as editable-and-effective on this screen
// would mislead the operator. `productId` uses a plain numeric `TextInput`,
// not `ProductSelect`, for its actual submitted value — see
// ProductSelect.tsx's own header comment for the backend limitation that
// makes a Product-uuid-valued picker incompatible with this field.
export function StockForm({
  companyUuid,
  branchUuid,
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save",
  isEditing = false,
}: StockFormProps) {
  const emptyValues: StockFormValues = {
    companyUuid: companyUuid ?? "",
    branchUuid: branchUuid ?? "",
    warehouseUuid: "",
    productId: "",
    quantityOnHand: "",
    quantityReserved: "",
    quantityAvailable: "",
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors },
  } = useForm<StockFormValues>({
    resolver: zodResolver(stockFormSchema),
    defaultValues: defaultValues ?? emptyValues,
  });

  const selectedCompanyUuid = watch("companyUuid");
  const selectedBranchUuid = watch("branchUuid");

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof StockFormValues;
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
          quantityOnHand: values.quantityOnHand || undefined,
          quantityReserved: values.quantityReserved || undefined,
          quantityAvailable: values.quantityAvailable || undefined,
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <TextInput
          label="Quantity On Hand"
          error={errors.quantityOnHand?.message}
          {...register("quantityOnHand")}
        />
        <TextInput
          label="Quantity Reserved"
          error={errors.quantityReserved?.message}
          {...register("quantityReserved")}
        />
        <TextInput
          label="Quantity Available"
          error={errors.quantityAvailable?.message}
          {...register("quantityAvailable")}
        />
      </div>
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        {submitLabel}
      </LoadingButton>
    </form>
  );
}
