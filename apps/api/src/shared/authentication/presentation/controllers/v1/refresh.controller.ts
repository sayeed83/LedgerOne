import { Request, Response } from "express";
import { refreshAccessToken } from "../../../business/refresh-access-token.service";
import { AuthenticationDependencies } from "../../../business/authentication.composition";
import { RefreshResponse } from "../../dto/responses/refresh.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData } from "../../support/response-envelope";
import { readRefreshTokenCookie } from "../../support/refresh-token-cookie";
import { peekTenantId } from "../../support/peek-tenant-id";
import { InvalidRefreshTokenError } from "../../../business/authentication-errors";

/**
 * `POST /api/v1/auth/refresh` — spec §17. Cookie-authenticated, not Bearer.
 * CSRF double-submit checking (CSRF-002) is deferred with the rest of this
 * task's excluded middleware — not implemented here.
 */
export function refreshController(deps: AuthenticationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const refreshToken = readRefreshTokenCookie(req);
    if (!refreshToken) {
      throw new InvalidRefreshTokenError();
    }

    const tenantId = peekTenantId(refreshToken);
    if (tenantId === undefined) {
      throw new InvalidRefreshTokenError();
    }

    const result = await refreshAccessToken({ tenantId, refreshToken }, deps);

    const body: RefreshResponse = { accessToken: result.accessToken };
    sendData(res, 200, body);
  });
}
