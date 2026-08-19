"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TenantSubscriptionStatus, type AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, Select, TextInput } from "@ledgerone/ui";
import { tenantSubscriptionFormSchema, type TenantSubscriptionFormValues } from "../schemas/tenant-subscription.schema";

export interface TenantSubscriptionFormProps {
  defaultValues?: TenantSubscriptionFormValues;
  onSubmit: (values: TenantSubscriptionFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
  /** Only the edit form may revise `status` — a new subscription always starts at Provisioning (its schema default), never accepted as create input. */
  isEditing?: boolean;
}

const STATUS_OPTIONS = Object.values(TenantSubscriptionStatus).map((value) => ({ value, label: value }));

// Mirrors TenantSettingsForm.tsx's exact pattern. `subscribedModules` is a
// comma-separated TextInput (no module-picker entity exists yet, ORG-004) —
// split into an array only at the call site's own submit handler, never
// inside this schema.
export function TenantSubscriptionForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save",
  isEditing = false,
}: TenantSubscriptionFormProps) {
  const emptyValues: TenantSubscriptionFormValues = {
    planCode: "",
    subscribedModules: "",
    currentPeriodStartsAt: "",
    currentPeriodEndsAt: "",
    status: undefined,
  };

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<TenantSubscriptionFormValues>({
    resolver: zodResolver(tenantSubscriptionFormSchema),
    defaultValues: defaultValues ?? emptyValues,
  });

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof TenantSubscriptionFormValues;
      if (field in emptyValues) {
        setError(field, { type: "server", message: detail.message });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldErrors, setError]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <ErrorAlert message={serverError} />
      <TextInput
        label="Plan Code"
        placeholder="STANDARD"
        error={errors.planCode?.message}
        {...register("planCode")}
      />
      <TextInput
        label="Subscribed Modules"
        placeholder="accounting, inventory"
        hint="Comma-separated module keys (ORG-004)."
        error={errors.subscribedModules?.message}
        {...register("subscribedModules")}
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextInput
          label="Current Period Starts"
          type="date"
          error={errors.currentPeriodStartsAt?.message}
          {...register("currentPeriodStartsAt")}
        />
        <TextInput
          label="Current Period Ends"
          type="date"
          error={errors.currentPeriodEndsAt?.message}
          {...register("currentPeriodEndsAt")}
        />
      </div>
      {isEditing && (
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.status?.message}
            />
          )}
        />
      )}
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        {submitLabel}
      </LoadingButton>
    </form>
  );
}
