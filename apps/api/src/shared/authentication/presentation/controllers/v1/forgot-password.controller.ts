import { Request, Response } from "express";
import { requestPasswordReset } from "../../../business/request-password-reset.service";
import { AuthenticationDependencies } from "../../../business/authentication.composition";
import { forgotPasswordRequestSchema } from "../../dto/requests/forgot-password.dto";
import { MessageResponse } from "../../dto/responses/message.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

const GENERIC_MESSAGE = "If an account with that email exists, a password reset link has been sent.";

/**
 * `POST /api/v1/auth/forgot-password` — spec §17/§9. Unauthenticated.
 * Always returns the identical generic message regardless of whether the
 * account exists (AUTHN-005 extended to this endpoint) — the
 * Business-layer `resetToken`, if any, is not included in the HTTP
 * response; sending it by email is outside this module's scope (AWS SES
 * integration lives elsewhere), so it is intentionally discarded here.
 */
export function forgotPasswordController(deps: AuthenticationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const parsed = forgotPasswordRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", parsed.error.issues);
      return;
    }

    await requestPasswordReset({ tenantId: parsed.data.tenantId, email: parsed.data.email }, deps);

    const body: MessageResponse = { message: GENERIC_MESSAGE };
    sendData(res, 200, body);
  });
}
