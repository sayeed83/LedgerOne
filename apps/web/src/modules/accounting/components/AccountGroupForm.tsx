"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AccountType, type AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, Select, TextInput } from "@ledgerone/ui";
import { accountGroupFormSchema, type AccountGroupFormValues } from "../schemas/account-group.schema";
import { CompanySelect } from "./CompanySelect";
import { AccountGroupSelect } from "./AccountGroupSelect";

export interface AccountGroupFormProps {
  companyUuid?: string;
  defaultValues?: AccountGroupFormValues;
  onSubmit: (values: AccountGroupFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
  isEditing?: boolean;
  excludeAccountGroupUuid?: string;
}

const ACCOUNT_TYPE_OPTIONS = Object.values(AccountType).map((value) => ({ value, label: value }));

export function AccountGroupForm({
  companyUuid,
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save",
  isEditing = false,
  excludeAccountGroupUuid,
}: AccountGroupFormProps) {
  const emptyValues: AccountGroupFormValues = {
    companyUuid: companyUuid ?? "",
    name: "",
    accountType: AccountType.Asset,
    parentAccountGroupUuid: "",
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors },
  } = useForm<AccountGroupFormValues>({
    resolver: zodResolver(accountGroupFormSchema),
    defaultValues: defaultValues ?? emptyValues,
  });

  const selectedCompanyUuid = watch("companyUuid");

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof AccountGroupFormValues;
      if (field in emptyValues) {
        setError(field, { type: "server", message: detail.message });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldErrors, setError]);

  return (
    <form
      onSubmit={handleSubmit((values) =>
        onSubmit({ ...values, parentAccountGroupUuid: values.parentAccountGroupUuid || undefined }),
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
      <TextInput label="Name" error={errors.name?.message} {...register("name")} />
      <Controller
        name="accountType"
        control={control}
        render={({ field }) => (
          <Select
            label="Account Type"
            options={ACCOUNT_TYPE_OPTIONS}
            value={field.value}
            onChange={field.onChange}
            error={errors.accountType?.message}
          />
        )}
      />
      <Controller
        name="parentAccountGroupUuid"
        control={control}
        render={({ field }) => (
          <AccountGroupSelect
            companyUuid={selectedCompanyUuid}
            value={field.value ?? ""}
            onChange={field.onChange}
            label="Parent Account Group (optional)"
            error={errors.parentAccountGroupUuid?.message}
            excludeUuid={excludeAccountGroupUuid}
            optional
          />
        )}
      />
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        {submitLabel}
      </LoadingButton>
    </form>
  );
}
