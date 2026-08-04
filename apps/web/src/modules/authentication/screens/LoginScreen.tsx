"use client";

import { useRouter } from "next/navigation";
import { isMfaRequiredResponse } from "@ledgerone/shared-types";
import { LoginForm } from "../components/LoginForm";
import { useLogin } from "../hooks/use-login";
import { useAuth } from "../hooks/use-auth";
import { getAuthErrorMessage } from "../utils/auth-error-messages";
import type { LoginFormValues } from "../schemas/login.schema";

export function LoginScreen() {
  const router = useRouter();
  const { completeLogin, setMfaChallengeToken } = useAuth();
  const loginMutation = useLogin();

  function handleSubmit(values: LoginFormValues) {
    loginMutation.mutate(values, {
      onSuccess: (response) => {
        if (isMfaRequiredResponse(response)) {
          setMfaChallengeToken(response.mfaChallengeToken);
          router.push("/mfa-verify");
          return;
        }
        completeLogin(response.accessToken);
        router.push("/");
      },
    });
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-ink">
          Welcome back
        </h1>
        <p className="mt-1.5 text-sm text-gray-500 dark:text-ink-muted">
          Sign in to your LedgerOne workspace to continue.
        </p>
      </div>
      <LoginForm
        onSubmit={handleSubmit}
        isSubmitting={loginMutation.isPending}
        serverError={getAuthErrorMessage(loginMutation.error)}
        fieldErrors={loginMutation.error?.details}
      />
    </div>
  );
}
