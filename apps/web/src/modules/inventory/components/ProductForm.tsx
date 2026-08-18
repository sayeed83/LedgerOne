"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductStatus, type AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, Select, Switch, Textarea, TextInput } from "@ledgerone/ui";
import { productFormSchema, type ProductFormValues } from "../schemas/product.schema";
import { CompanySelect } from "./CompanySelect";
import { ProductCategorySelect } from "./ProductCategorySelect";
import { UnitSelect } from "./UnitSelect";

export interface ProductFormProps {
  companyUuid?: string;
  defaultValues?: ProductFormValues;
  onSubmit: (values: ProductFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
  isEditing?: boolean;
}

const PRODUCT_STATUS_OPTIONS = Object.values(ProductStatus).map((value) => ({ value, label: value }));

// Mirrors AccountForm.tsx's exact pattern (its closest existing analog: a
// Company-scoped entity with a status enum, a boolean flag, and two
// picker-field dependencies).
export function ProductForm({
  companyUuid,
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save",
  isEditing = false,
}: ProductFormProps) {
  const emptyValues: ProductFormValues = {
    companyUuid: companyUuid ?? "",
    productCode: "",
    name: "",
    description: "",
    productCategoryUuid: "",
    unitUuid: "",
    isStocked: false,
    status: ProductStatus.Draft,
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaultValues ?? emptyValues,
  });

  const selectedCompanyUuid = watch("companyUuid");

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof ProductFormValues;
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
          unitUuid: values.unitUuid || undefined,
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextInput
          label="Product Code"
          disabled={isEditing}
          error={errors.productCode?.message}
          {...register("productCode")}
        />
        <TextInput label="Name" error={errors.name?.message} {...register("name")} />
      </div>
      <Textarea label="Description (optional)" error={errors.description?.message} {...register("description")} />
      <Controller
        name="productCategoryUuid"
        control={control}
        render={({ field }) => (
          <ProductCategorySelect
            companyUuid={selectedCompanyUuid}
            value={field.value}
            onChange={field.onChange}
            error={errors.productCategoryUuid?.message}
          />
        )}
      />
      <Controller
        name="unitUuid"
        control={control}
        render={({ field }) => (
          <UnitSelect
            companyUuid={selectedCompanyUuid}
            value={field.value ?? ""}
            onChange={field.onChange}
            label="Unit of Measure (optional)"
            error={errors.unitUuid?.message}
            optional
          />
        )}
      />
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <Select
            label="Status"
            options={PRODUCT_STATUS_OPTIONS}
            value={field.value}
            onChange={field.onChange}
            error={errors.status?.message}
          />
        )}
      />
      <Controller
        name="isStocked"
        control={control}
        render={({ field }) => (
          <Switch
            label="Stocked"
            hint="A Stocked Product is tracked in inventory quantities."
            checked={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        {submitLabel}
      </LoadingButton>
    </form>
  );
}
