"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StockMovementType, type AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, Select, TextInput } from "@ledgerone/ui";
import { stockMovementFormSchema, type StockMovementFormValues } from "../schemas/stock-movement.schema";
import { CompanySelect } from "./CompanySelect";
import { BranchSelect } from "./BranchSelect";
import { WarehouseSelect } from "./WarehouseSelect";
import { ProductSelect } from "./ProductSelect";

export interface StockMovementFormProps {
  /** Scopes `BranchSelect`'s Company-filtered branch list — mirrors InventoryAdjustmentForm's own `companyUuid` prop. */
  companyUuid?: string;
  /** Prefills the `branchUuid` field (mirrors InventoryAdjustmentForm's own `branchUuid` prop) — scopes both `WarehouseSelect` pickers. */
  branchUuid?: string;
  onSubmit: (values: StockMovementFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
}

const MOVEMENT_TYPE_OPTIONS = Object.values(StockMovementType).map((value) => ({ value, label: value }));

// Mirrors InventoryAdjustmentForm.tsx's exact pattern (its closest existing
// analog: a Company-scoped entity that also needs Branch-scoped Warehouse
// picker dependencies and a raw internal `productId`) — CREATE ONLY. Stock
// Movement is an immutable ledger entity (00_BUSINESS_RULES.md
// Ch.39.5/STM-002) — there is no update/edit mode, so unlike
// `InventoryAdjustmentForm`/`StockForm` this component has no
// `isEditing`/`defaultValues`/`submitLabel` props and no disabled fields.
//
// Two independent `WarehouseSelect` pickers (`sourceWarehouseUuid`/
// `destinationWarehouseUuid`) share the same `branchUuid` scoping field,
// implementing Ch.39.10's ERD's own two-Warehouse-relationship shape. Which
// one(s) are required for the selected `movementType` is enforced by
// `stockMovementFormSchema`'s own `superRefine` (Ch.39.8/STM-003) — the same
// rule the backend's `createStockMovement` already enforces, restated here
// only for immediate client-side feedback, not a new rule. `productId` uses
// a plain numeric `TextInput`, not `ProductSelect`, for its actual submitted
// value — see ProductSelect.tsx's own header comment for the backend
// limitation that makes a Product-uuid-valued picker incompatible with this
// field (identical reasoning to InventoryAdjustmentForm's/StockForm's own
// `productId` treatment).
export function StockMovementForm({
  companyUuid,
  branchUuid,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
}: StockMovementFormProps) {
  const emptyValues: StockMovementFormValues = {
    companyUuid: companyUuid ?? "",
    branchUuid: branchUuid ?? "",
    productId: "",
    sourceWarehouseUuid: "",
    destinationWarehouseUuid: "",
    movementType: StockMovementType.Receipt,
    quantity: "",
    referenceType: "",
    referenceUuid: "",
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors },
  } = useForm<StockMovementFormValues>({
    resolver: zodResolver(stockMovementFormSchema),
    defaultValues: emptyValues,
  });

  const selectedCompanyUuid = watch("companyUuid");
  const selectedBranchUuid = watch("branchUuid");

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof StockMovementFormValues;
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
          sourceWarehouseUuid: values.sourceWarehouseUuid || undefined,
          destinationWarehouseUuid: values.destinationWarehouseUuid || undefined,
          referenceType: values.referenceType || undefined,
          referenceUuid: values.referenceUuid || undefined,
        }),
      )}
      className="flex flex-col gap-5"
      noValidate
    >
      <ErrorAlert message={serverError} />
      {companyUuid ? (
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
          />
        )}
      />
      <Controller
        name="movementType"
        control={control}
        render={({ field }) => (
          <Select
            label="Movement Type"
            options={MOVEMENT_TYPE_OPTIONS}
            value={field.value}
            onChange={field.onChange}
            error={errors.movementType?.message}
          />
        )}
      />
      <Controller
        name="sourceWarehouseUuid"
        control={control}
        render={({ field }) => (
          <WarehouseSelect
            label="Source Warehouse"
            branchUuid={selectedBranchUuid}
            value={field.value ?? ""}
            onChange={field.onChange}
            error={errors.sourceWarehouseUuid?.message}
          />
        )}
      />
      <Controller
        name="destinationWarehouseUuid"
        control={control}
        render={({ field }) => (
          <WarehouseSelect
            label="Destination Warehouse"
            branchUuid={selectedBranchUuid}
            value={field.value ?? ""}
            onChange={field.onChange}
            error={errors.destinationWarehouseUuid?.message}
          />
        )}
      />
      <TextInput
        label="Product ID"
        hint="The Product's internal identifier (not its Product Code)."
        error={errors.productId?.message}
        {...register("productId")}
      />
      <ProductSelect
        companyUuid={selectedCompanyUuid}
        value=""
        onChange={() => {
          /* Look-up aid only — see ProductSelect.tsx's own header comment for why its uuid-valued selection cannot populate the Product ID field above. */
        }}
      />
      <TextInput label="Quantity" error={errors.quantity?.message} {...register("quantity")} />
      <TextInput
        label="Reference Type (optional)"
        hint="e.g. GOODS_RECEIPT, DELIVERY — the type of the originating business transaction."
        error={errors.referenceType?.message}
        {...register("referenceType")}
      />
      <TextInput
        label="Reference UUID (optional)"
        hint="The originating business transaction's identifier."
        error={errors.referenceUuid?.message}
        {...register("referenceUuid")}
      />
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        Create Stock Movement
      </LoadingButton>
    </form>
  );
}
