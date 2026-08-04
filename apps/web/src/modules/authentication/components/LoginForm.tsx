"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import type { AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, HashIcon, LoadingButton, MailIcon, PasswordInput, TextInput } from "@ledgerone/ui";
import { loginFormSchema, type LoginFormValues } from "../schemas/login.schema";

export interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
}

// FORM-001: React Hook Form, no ad hoc per-field useState.
export function LoginForm({ onSubmit, isSubmitting, serverError, fieldErrors }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { tenantId: "", email: "", password: "" },
  });

  // FORM-002/003: a server-rejected 422's field-level details are mapped
  // onto the corresponding RHF field even though client validation passed.
  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      if (detail.field === "tenantId" || detail.field === "email" || detail.field === "password") {
        setError(detail.field, { type: "server", message: detail.message });
      }
    });
  }, [fieldErrors, setError]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <ErrorAlert message={serverError} />
      <TextInput
        label="Tenant ID"
        icon={<HashIcon className="h-[18px] w-[18px]" />}
        hint="Temporary — required until tenant resolution is available."
        error={errors.tenantId?.message}
        placeholder="1"
        {...register("tenantId")}
      />
      <TextInput
        label="Email"
        type="email"
        autoComplete="email"
        icon={<MailIcon className="h-[18px] w-[18px]" />}
        placeholder="you@company.com"
        error={errors.email?.message}
        {...register("email")}
      />
      <div className="flex flex-col gap-1.5">
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          placeholder="••••••••••••"
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Forgot password?
          </Link>
        </div>
      </div>
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Signing in…" className="w-full">
        Sign in
      </LoadingButton>
    </form>
  );
}
