"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { WarehouseStatus, type AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, Select, Textarea, TextInput } from "@ledgerone/ui";
import { warehouseFormSchema, type WarehouseFormValues } from "../schemas/warehouse.schema";
import { BranchSelect } from "./BranchSelect";

export interface WarehouseFormProps {
  /** Scopes `BranchSelect`'s own Company-filtered branch list only — not a submitted form field (Warehouse has no `companyUuid` of its own, WHS-001/Ch.37.9: its real parent is Branch). */
  companyUuid: string;
  /** Prefills the `branchUuid` field (mirrors ProductForm's own `companyUuid` prop) — the list screen's own active Branch selection. */
  branchUuid?: string;
  defaultValues?: WarehouseFormValues;
  onSubmit: (values: WarehouseFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
  isEditing?: boolean;
}

const WAREHOUSE_STATUS_OPTIONS = Object.values(WarehouseStatus).map((value) => ({ value, label: value }));

// Mirrors ProductForm.tsx's exact pattern (its closest existing analog: a
// Branch/Company-scoped entity with a status enum and one picker-field
// dependency) — simpler than ProductForm since Warehouse has no boolean
// flag (`isStocked`) or second picker dependency.
export function WarehouseForm({
  companyUuid,
  branchUuid,
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save",
  isEditing = false,
}: WarehouseFormProps) {
  const emptyValues: WarehouseFormValues = {
    branchUuid: branchUuid ?? "",
    warehouseCode: "",
    name: "",
    description: "",
    status: WarehouseStatus.Active,
  };

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: defaultValues ?? emptyValues,
  });

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof WarehouseFormValues;
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
          description: values.description || undefined,
        }),
      )}
      className="flex flex-col gap-5"
      noValidate
    >
      <ErrorAlert message={serverError} />
      <Controller
        name="branchUuid"
        control={control}
        render={({ field }) => (
          <BranchSelect
            companyUuid={companyUuid}
            value={field.value}
            onChange={field.onChange}
            error={errors.branchUuid?.message}
            disabled={isEditing}
          />
        )}
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextInput
          label="Warehouse Code"
          disabled={isEditing}
          error={errors.warehouseCode?.message}
          {...register("warehouseCode")}
        />
        <TextInput label="Name" error={errors.name?.message} {...register("name")} />
      </div>
      <Textarea label="Description (optional)" error={errors.description?.message} {...register("description")} />
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <Select
            label="Status"
            options={WAREHOUSE_STATUS_OPTIONS}
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
