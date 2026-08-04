export interface ResetPasswordRequestDto {
  tenantId: string;
  token: string;
  newPassword: string;
}
