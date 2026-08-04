import axios, { AxiosError } from "axios";
import type { AuthErrorCode, AuthErrorFieldDetailDto } from "@ledgerone/shared-types";

export interface ApiError {
  status: number;
  code: AuthErrorCode | "NETWORK_ERROR";
  message: string;
  details?: AuthErrorFieldDetailDto[];
}

export function isApiError(value: unknown): value is ApiError {
  return typeof value === "object" && value !== null && "code" in value && "message" in value;
}

// Paths that issue an expected, form-level 401 (bad credentials, expired
// challenge/reset token) rather than an expired *session* — these must
// never trigger the shared session-expiry flow (ERR-005).
const AUTH_REDIRECT_EXEMPT_PATHS = [
  "/auth/login",
  "/auth/mfa/verify",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/logout",
];

let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function registerUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

// ARCH-003/API-001: the one Axios instance for the entire app.
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: { code: string; message: string; details?: unknown } }>) => {
    if (!error.response) {
      return Promise.reject<ApiError>({
        status: 0,
        code: "NETWORK_ERROR",
        message: "Unable to reach the server. Check your connection and try again.",
      });
    }

    const status = error.response.status;
    const body = error.response.data?.error;
    const normalized: ApiError = {
      status,
      code: (body?.code as AuthErrorCode) ?? "INTERNAL_ERROR",
      message: body?.message ?? "Something went wrong. Please try again.",
      details: Array.isArray(body?.details)
        ? (body!.details as { path: Array<string | number>; message: string }[]).map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          }))
        : undefined,
    };

    const requestPath = error.config?.url ?? "";
    const isExempt = AUTH_REDIRECT_EXEMPT_PATHS.some((path) => requestPath.endsWith(path));
    if (status === 401 && !isExempt) {
      unauthorizedHandler?.();
    }

    return Promise.reject(normalized);
  },
);
