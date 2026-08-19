"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, Textarea, TextInput } from "@ledgerone/ui";
import { roleFormSchema, type RoleFormValues } from "../schemas/role.schema";

export interface RoleFormProps {
  defaultValues?: RoleFormValues;
  onSubmit: (values: RoleFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
}

// Mirrors TenantForm.tsx's/TaxGroupForm.tsx's exact pattern — a plain,
// no-lifecycle-field, no-picker-dependency form.
export function RoleForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save",
}: RoleFormProps) {
  const emptyValues: RoleFormValues = { name: "", description: "" };

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: defaultValues ?? emptyValues,
  });

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof RoleFormValues;
      if (field in emptyValues) {
        setError(field, { type: "server", message: detail.message });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldErrors, setError]);

  return (
    <form
      onSubmit={handleSubmit((values) =>
        onSubmit({ ...values, description: values.description || undefined }),
      )}
      className="flex flex-col gap-5"
      noValidate
    >
      <ErrorAlert message={serverError} />
      <TextInput label="Name" placeholder="Accountant" error={errors.name?.message} {...register("name")} />
      <Textarea
        label="Description (optional)"
        placeholder="Manages accounting master data and journal entries."
        error={errors.description?.message}
        {...register("description")}
      />
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        {submitLabel}
      </LoadingButton>
    </form>
  );
}
