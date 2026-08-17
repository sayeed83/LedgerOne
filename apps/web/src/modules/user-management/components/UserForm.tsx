"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, TextInput } from "@ledgerone/ui";
import { userFormSchema, type UserFormValues } from "../schemas/user.schema";
import { UserOrganizationFields } from "./UserOrganizationFields";

export interface UserFormProps {
  defaultValues?: UserFormValues;
  onSubmit: (values: UserFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
}

const EMPTY_VALUES: UserFormValues = {
  companyUuid: "",
  branchUuid: "",
  departmentUuid: "",
  firstName: "",
  middleName: "",
  lastName: "",
  displayName: "",
  email: "",
  mobileNumber: "",
};

// FORM-001: React Hook Form, no ad hoc per-field useState.
export function UserForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save",
}: UserFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: defaultValues ?? EMPTY_VALUES,
  });

  const companyUuid = useWatch({ control, name: "companyUuid" });
  const branchUuid = useWatch({ control, name: "branchUuid" });
  const departmentUuid = useWatch({ control, name: "departmentUuid" });

  // FORM-002/003: a server-rejected 422's field-level details are mapped
  // onto the corresponding RHF field even though client validation passed.
  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof UserFormValues;
      if (field in EMPTY_VALUES) {
        setError(field, { type: "server", message: detail.message });
      }
    });
  }, [fieldErrors, setError]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <ErrorAlert message={serverError} />

      <UserOrganizationFields
        companyUuid={companyUuid}
        branchUuid={branchUuid}
        departmentUuid={departmentUuid}
        companyError={errors.companyUuid?.message}
        onCompanyChange={(value) => {
          setValue("companyUuid", value, { shouldValidate: true });
          setValue("branchUuid", "");
          setValue("departmentUuid", "");
        }}
        onBranchChange={(value) => setValue("branchUuid", value)}
        onDepartmentChange={(value) => setValue("departmentUuid", value)}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextInput label="First Name" error={errors.firstName?.message} {...register("firstName")} />
        <TextInput label="Middle Name" error={errors.middleName?.message} {...register("middleName")} />
        <TextInput label="Last Name" error={errors.lastName?.message} {...register("lastName")} />
        <TextInput label="Display Name" error={errors.displayName?.message} {...register("displayName")} />
        <TextInput
          label="Email"
          type="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <TextInput
          label="Mobile Number"
          error={errors.mobileNumber?.message}
          {...register("mobileNumber")}
        />
      </div>
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        {submitLabel}
      </LoadingButton>
    </form>
  );
}
