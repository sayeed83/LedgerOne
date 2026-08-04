export interface LoginRequestDto {
  tenantId: string;
  email: string;
  password: string;
}

export interface AuthenticatedResponseDto {
  accessToken: string;
}

export interface MfaRequiredResponseDto {
  mfaChallengeToken: string;
}

export type LoginResponseDto = AuthenticatedResponseDto | MfaRequiredResponseDto;

export function isMfaRequiredResponse(
  response: LoginResponseDto,
): response is MfaRequiredResponseDto {
  return "mfaChallengeToken" in response;
}
