import * as speakeasy from "speakeasy";
import { GeneratedTotpSecret, ITotpProvider } from "../../domain/interfaces/totp-provider.interface";

// ADR-002: Speakeasy, TOTP defaults (6-digit code, 30s step) — not
// overridden, since no LedgerOne-specific digit/step value is mandated
// anywhere in the handbook.
export class SpeakeasyTotpProvider implements ITotpProvider {
  generateSecret(accountLabel: string): GeneratedTotpSecret {
    const secret = speakeasy.generateSecret({ length: 20, name: accountLabel });
    return { base32: secret.base32, otpauthUrl: secret.otpauth_url ?? "" };
  }

  verifyToken(base32Secret: string, code: string): boolean {
    return speakeasy.totp.verify({ secret: base32Secret, encoding: "base32", token: code });
  }
}
