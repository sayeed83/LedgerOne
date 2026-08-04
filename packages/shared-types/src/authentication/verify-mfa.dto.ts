export interface VerifyMfaRequestDto {
  mfaChallengeToken: string;
  totpCode: string;
}
