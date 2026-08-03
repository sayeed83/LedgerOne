import { Request, Response } from "express";
import { verifyMfaChallenge } from "../../../business/verify-mfa-challenge.service";
import { AuthenticationDependencies } from "../../../business/authentication.composition";
import { verifyMfaRequestSchema } from "../../dto/requests/verify-mfa.dto";
import { AuthenticatedResponse } from "../../dto/responses/authenticated.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";
import { setRefreshTokenCookie } from "../../support/refresh-token-cookie";
import { peekTenantId } from "../../support/peek-tenant-id";
import { MfaChallengeInvalidError } from "../../../business/authentication-errors";

/** `POST /api/v1/auth/mfa/verify` — spec §17. Unauthenticated; requires a valid `mfaChallengeToken`. */
export function verifyMfaController(deps: AuthenticationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const parsed = verifyMfaRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", parsed.error.issues);
      return;
    }

    const tenantId = peekTenantId(parsed.data.mfaChallengeToken);
    if (tenantId === undefined) {
      throw new MfaChallengeInvalidError();
    }

    const result = await verifyMfaChallenge(
      {
        tenantId,
        mfaChallengeToken: parsed.data.mfaChallengeToken,
        totpCode: parsed.data.totpCode,
        sourceIp: req.ip ?? "unknown",
        userAgent: req.get("user-agent") ?? null,
      },
      deps,
    );

    setRefreshTokenCookie(res, result.refreshToken);
    const body: AuthenticatedResponse = { accessToken: result.accessToken };
    sendData(res, 200, body);
  });
}
