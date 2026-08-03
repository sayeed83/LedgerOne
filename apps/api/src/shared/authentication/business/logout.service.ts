// Business layer — revokes the current session's refresh token (spec §17
// `POST /auth/logout`, Acceptance Criterion #6). Idempotent: logging out
// twice with the same token is not an error the second time.
import { IAuthenticationRepository } from "../domain/interfaces/authentication-repository.interface";
import { ITokenIssuer } from "../domain/interfaces/token-issuer.interface";
import { InvalidRefreshTokenError } from "../domain/errors/authentication.errors";

export interface LogoutInput {
  tenantId: bigint;
  refreshToken: string;
}

export interface LogoutDeps {
  repository: IAuthenticationRepository;
  tokenIssuer: ITokenIssuer;
}

export async function logout(input: LogoutInput, deps: LogoutDeps): Promise<void> {
  const { repository, tokenIssuer } = deps;

  let claims;
  try {
    claims = tokenIssuer.verifyRefreshToken(input.refreshToken);
  } catch {
    throw new InvalidRefreshTokenError();
  }

  if (claims.tenantId !== input.tenantId.toString()) {
    throw new InvalidRefreshTokenError();
  }

  const record = await repository.findValidRefreshToken(input.tenantId, claims.jti);
  if (!record) {
    return; // already revoked or expired — nothing to do.
  }

  await repository.revokeRefreshToken(input.tenantId, record.id);
}
