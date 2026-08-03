import { Request, Response } from "express";
import { logout } from "../../../business/logout.service";
import { AuthenticationDependencies } from "../../../business/authentication.composition";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { clearRefreshTokenCookie, readRefreshTokenCookie } from "../../support/refresh-token-cookie";
import { peekTenantId } from "../../support/peek-tenant-id";
import { InvalidRefreshTokenError } from "../../../business/authentication-errors";

/**
 * `POST /api/v1/auth/logout` — spec §17. Spec marks this Bearer-authenticated
 * (the caller must hold a valid access token); enforcing that is a jwt-auth
 * middleware concern excluded from this task's scope, so it is not checked
 * here. The revocation itself only ever needed the refresh-token cookie —
 * that's what the Business layer's `logout` use case operates on.
 */
export function logoutController(deps: AuthenticationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const refreshToken = readRefreshTokenCookie(req);
    if (!refreshToken) {
      throw new InvalidRefreshTokenError();
    }

    const tenantId = peekTenantId(refreshToken);
    if (tenantId === undefined) {
      throw new InvalidRefreshTokenError();
    }

    await logout({ tenantId, refreshToken }, deps);

    clearRefreshTokenCookie(res);
    res.status(204).send();
  });
}
