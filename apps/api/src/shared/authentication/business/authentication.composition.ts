// Composition root (05_CODING_STANDARDS.md Ch.10.4) — the one place that
// wires concrete implementations to the interfaces every use-case service
// depends on. No DI container (Ch.10.5); plain manual construction. Not
// used by unit tests, which build their own fake `deps` (Ch.10.6) — this
// file is for the future Presentation layer to import.
import { PrismaAuthenticationRepository } from "../repository/authentication.repository";
import { Argon2PasswordHasher } from "./security/argon2-password-hasher";
import { SpeakeasyTotpProvider } from "./security/speakeasy-totp-provider";
import { SystemClock } from "./security/system-clock";
import { JwtTokenIssuer, JwtTokenIssuerKeys } from "./security/jwt-token-issuer";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.includes("\\n") ? value.replace(/\\n/g, "\n") : value;
}

function loadTokenIssuerKeys(): JwtTokenIssuerKeys {
  return {
    accessTokenPrivateKey: requireEnv("JWT_PRIVATE_KEY"),
    accessTokenPublicKey: requireEnv("JWT_PUBLIC_KEY"),
    refreshTokenPrivateKey: requireEnv("REFRESH_TOKEN_PRIVATE_KEY"),
    refreshTokenPublicKey: requireEnv("REFRESH_TOKEN_PUBLIC_KEY"),
  };
}

export function createAuthenticationDependencies() {
  return {
    repository: new PrismaAuthenticationRepository(),
    passwordHasher: new Argon2PasswordHasher(),
    tokenIssuer: new JwtTokenIssuer(loadTokenIssuerKeys()),
    totpProvider: new SpeakeasyTotpProvider(),
    clock: new SystemClock(),
  };
}

/** The shape every Presentation-layer controller in this module depends on — real deps here, fakes in tests (Ch.10.6). */
export type AuthenticationDependencies = ReturnType<typeof createAuthenticationDependencies>;
