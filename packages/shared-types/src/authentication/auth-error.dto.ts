export type AuthErrorCode =
  | "VALIDATION_ERROR"
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_ACCOUNT_LOCKED"
  | "AUTH_MFA_CHALLENGE_INVALID"
  | "AUTH_MFA_NOT_ENABLED"
  | "AUTH_INVALID_REFRESH_TOKEN"
  | "AUTH_INVALID_RESET_TOKEN"
  | "AUTH_PASSWORD_POLICY_VIOLATION"
  | "AUTH_DOMAIN_ERROR"
  | "INTERNAL_ERROR";

export interface AuthErrorFieldDetailDto {
  field: string;
  message: string;
}

export interface AuthErrorResponseDto {
  code: AuthErrorCode;
  message: string;
  details?: AuthErrorFieldDetailDto[];
}
