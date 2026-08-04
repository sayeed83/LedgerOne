import type { ApiError } from "@/services/api-client";

// ERR-002/003: known Authentication error codes map to specific,
// actionable copy; anything unmapped falls back to a safe generic
// message — never the raw server exception text.
const AUTH_ERROR_MESSAGES: Partial<Record<ApiError["code"], string>> = {
  AUTH_INVALID_CREDENTIALS: "Invalid email or password.",
  AUTH_ACCOUNT_LOCKED:
    "Your account is temporarily locked after too many failed attempts. Please try again in 15 minutes.",
  AUTH_MFA_CHALLENGE_INVALID: "Your verification session has expired. Please log in again.",
  AUTH_MFA_NOT_ENABLED: "Multi-factor authentication is not enabled for this account.",
  AUTH_INVALID_REFRESH_TOKEN: "Your session has expired. Please log in again.",
  AUTH_INVALID_RESET_TOKEN:
    "This password reset link is invalid, expired, or has already been used.",
  VALIDATION_ERROR: "Please check the highlighted fields and try again.",
  NETWORK_ERROR: "Unable to reach the server. Check your connection and try again.",
};

export function getAuthErrorMessage(error: ApiError | null | undefined): string | undefined {
  if (!error) {
    return undefined;
  }
  if (error.code === "AUTH_PASSWORD_POLICY_VIOLATION") {
    // The server's own message is already specific and safe to show.
    return error.message;
  }
  return AUTH_ERROR_MESSAGES[error.code] ?? "Something went wrong. Please try again.";
}
