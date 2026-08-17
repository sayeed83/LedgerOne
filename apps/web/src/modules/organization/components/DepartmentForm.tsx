"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, TextInput } from "@ledgerone/ui";
import { departmentFormSchema, type DepartmentFormValues } from "../schemas/department.schema";

export interface DepartmentFormProps {
  defaultValues?: DepartmentFormValues;
  onSubmit: (values: DepartmentFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
}

const EMPTY_VALUES: DepartmentFormValues = { departmentCode: "", departmentName: "" };

// FORM-001: React Hook Form, no ad hoc per-field useState.
export function DepartmentForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save",
}: DepartmentFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: defaultValues ?? EMPTY_VALUES,
  });

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof DepartmentFormValues;
      if (field in EMPTY_VALUES) {
        setError(field, { type: "server", message: detail.message });
      }
    });
  }, [fieldErrors, setError]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <ErrorAlert message={serverError} />
      <TextInput
        label="Department Code"
        error={errors.departmentCode?.message}
        {...register("departmentCode")}
      />
      <TextInput
        label="Department Name"
        error={errors.departmentName?.message}
        {...register("departmentName")}
      />
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        {submitLabel}
      </LoadingButton>
    </form>
  );
}
