import { Request, Response } from "express";
import { resetPassword } from "../../../business/reset-password.service";
import { AuthenticationDependencies } from "../../../business/authentication.composition";
import { resetPasswordRequestSchema } from "../../dto/requests/reset-password.dto";
import { MessageResponse } from "../../dto/responses/message.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/auth/reset-password` — spec §17/§10. Unauthenticated; requires a valid reset token. */
export function resetPasswordController(deps: AuthenticationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const parsed = resetPasswordRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", parsed.error.issues);
      return;
    }

    await resetPassword(
      { tenantId: parsed.data.tenantId, token: parsed.data.token, newPassword: parsed.data.newPassword },
      deps,
    );

    const body: MessageResponse = { message: "Password has been reset successfully." };
    sendData(res, 200, body);
  });
}
