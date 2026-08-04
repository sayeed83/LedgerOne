import type {
  AuthenticatedResponseDto,
  ForgotPasswordRequestDto,
  LoginRequestDto,
  LoginResponseDto,
  MessageResponseDto,
  RefreshResponseDto,
  ResetPasswordRequestDto,
  VerifyMfaRequestDto,
} from "@ledgerone/shared-types";
import { apiClient } from "./api-client";

interface Envelope<T> {
  data: T;
}

// FLD-004/API-002: sole API wrapper for the Authentication module — every
// function returns the unwrapped `data` payload.
export async function login(payload: LoginRequestDto): Promise<LoginResponseDto> {
  const response = await apiClient.post<Envelope<LoginResponseDto>>("/auth/login", payload);
  return response.data.data;
}

export async function verifyMfa(payload: VerifyMfaRequestDto): Promise<AuthenticatedResponseDto> {
  const response = await apiClient.post<Envelope<AuthenticatedResponseDto>>(
    "/auth/mfa/verify",
    payload,
  );
  return response.data.data;
}

export async function refresh(): Promise<RefreshResponseDto> {
  const response = await apiClient.post<Envelope<RefreshResponseDto>>("/auth/refresh");
  return response.data.data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function forgotPassword(payload: ForgotPasswordRequestDto): Promise<MessageResponseDto> {
  const response = await apiClient.post<Envelope<MessageResponseDto>>(
    "/auth/forgot-password",
    payload,
  );
  return response.data.data;
}

export async function resetPassword(payload: ResetPasswordRequestDto): Promise<MessageResponseDto> {
  const response = await apiClient.post<Envelope<MessageResponseDto>>(
    "/auth/reset-password",
    payload,
  );
  return response.data.data;
}
