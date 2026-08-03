import { Request, Response } from "express";
import { authenticateWithPassword } from "../../../business/authenticate-with-password.service";
import { AuthenticationDependencies } from "../../../business/authentication.composition";
import { loginRequestSchema } from "../../dto/requests/login.dto";
import { AuthenticatedResponse } from "../../dto/responses/authenticated.response.dto";
import { MfaRequiredResponse } from "../../dto/responses/mfa-required.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";
import { setRefreshTokenCookie } from "../../support/refresh-token-cookie";

/** `POST /api/v1/auth/login` — spec §17. Unauthenticated. */
export function loginController(deps: AuthenticationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const parsed = loginRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", parsed.error.issues);
      return;
    }

    const result = await authenticateWithPassword(
      {
        tenantId: parsed.data.tenantId,
        email: parsed.data.email,
        password: parsed.data.password,
        sourceIp: req.ip ?? "unknown",
        userAgent: req.get("user-agent") ?? null,
      },
      deps,
    );

    if (result.status === "mfa_required") {
      const body: MfaRequiredResponse = { mfaChallengeToken: result.mfaChallengeToken };
      sendData(res, 200, body);
      return;
    }

    setRefreshTokenCookie(res, result.refreshToken);
    const body: AuthenticatedResponse = { accessToken: result.accessToken };
    sendData(res, 200, body);
  });
}
