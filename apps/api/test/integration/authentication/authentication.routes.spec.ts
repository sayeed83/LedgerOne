// Presentation-layer integration tests — exercise the real Express router
// end-to-end (real JwtTokenIssuer + SystemClock so cookie/JWT plumbing is
// genuinely tested) with a fake Repository/PasswordHasher/TotpProvider
// (05_CODING_STANDARDS.md Ch.10.6) so no database or real crypto cost is
// needed. No live `app`/server exists yet (see index.ts) — the router is
// exercised directly via supertest wrapped in a bare Express instance.
import express from "express";
import request from "supertest";
import { generateKeyPairSync } from "crypto";
import { createAuthenticationRouter } from "../../../src/shared/authentication";
import { AuthenticationDependencies } from "../../../src/shared/authentication/business/authentication.composition";
import { JwtTokenIssuer } from "../../../src/shared/authentication/business/security/jwt-token-issuer";
import { SystemClock } from "../../../src/shared/authentication/business/security/system-clock";
import { IPasswordHasher } from "../../../src/shared/authentication/domain/interfaces/password-hasher.interface";
import { ITotpProvider } from "../../../src/shared/authentication/domain/interfaces/totp-provider.interface";
import { buildUserCredential, createFakeAuthenticationRepository } from "../../../src/shared/authentication/business/test-support/fixtures";

function generateRsaKeyPair() {
  return generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
}

function buildApp(deps: AuthenticationDependencies) {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/auth", createAuthenticationRouter(deps));
  return app;
}

function buildDeps(): AuthenticationDependencies {
  const accessKeys = generateRsaKeyPair();
  const refreshKeys = generateRsaKeyPair();
  const tokenIssuer = new JwtTokenIssuer({
    accessTokenPrivateKey: accessKeys.privateKey,
    accessTokenPublicKey: accessKeys.publicKey,
    refreshTokenPrivateKey: refreshKeys.privateKey,
    refreshTokenPublicKey: refreshKeys.publicKey,
  });

  const passwordHasher: IPasswordHasher = {
    hash: async (plain) => `hashed:${plain}`,
    verify: async (hash, plain) => hash === `hashed:${plain}`,
  };

  const totpProvider: ITotpProvider = {
    generateSecret: () => ({ base32: "SECRET", otpauthUrl: "otpauth://totp/x" }),
    verifyToken: (_secret, code) => code === "123456",
  };

  return {
    repository: createFakeAuthenticationRepository(),
    passwordHasher,
    tokenIssuer,
    totpProvider,
    clock: new SystemClock(),
  };
}

describe("Authentication routes", () => {
  describe("POST /api/v1/auth/login", () => {
    it("returns 422 on malformed input", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).post("/api/v1/auth/login").send({ tenantId: "1", email: "not-an-email" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 401 for unknown credentials", async () => {
      const deps = buildDeps();
      (deps.repository.findCredentialByEmail as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .post("/api/v1/auth/login")
        .send({ tenantId: "1", email: "nobody@example.com", password: "hashed:whatever" });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTH_INVALID_CREDENTIALS");
    });

    it("returns 200 with an access token and sets the refresh-token cookie when MFA is disabled", async () => {
      const deps = buildDeps();
      const credential = buildUserCredential({ isMfaEnabled: false, passwordHash: "hashed:correct-password" });
      (deps.repository.findCredentialByEmail as jest.Mock).mockResolvedValue(credential);

      const res = await request(buildApp(deps))
        .post("/api/v1/auth/login")
        .send({ tenantId: "1", email: credential.email, password: "correct-password" });

      expect(res.status).toBe(200);
      expect(typeof res.body.data.accessToken).toBe("string");
      expect(res.body.data.refreshToken).toBeUndefined();
      const cookies = res.headers["set-cookie"] as unknown as string[];
      expect(cookies.some((c) => c.startsWith("refreshToken=") && c.includes("HttpOnly"))).toBe(true);
    });

    it("returns an mfaChallengeToken and no cookie when MFA is enabled", async () => {
      const deps = buildDeps();
      const credential = buildUserCredential({
        isMfaEnabled: true,
        mfaSecret: "SECRET",
        passwordHash: "hashed:correct-password",
      });
      (deps.repository.findCredentialByEmail as jest.Mock).mockResolvedValue(credential);

      const res = await request(buildApp(deps))
        .post("/api/v1/auth/login")
        .send({ tenantId: "1", email: credential.email, password: "correct-password" });

      expect(res.status).toBe(200);
      expect(typeof res.body.data.mfaChallengeToken).toBe("string");
      expect(res.headers["set-cookie"]).toBeUndefined();
    });
  });

  describe("POST /api/v1/auth/mfa/verify", () => {
    it("completes login with a valid TOTP code", async () => {
      const deps = buildDeps();
      const credential = buildUserCredential({ isMfaEnabled: true, mfaSecret: "SECRET", passwordHash: "hashed:correct-password" });
      (deps.repository.findCredentialByEmail as jest.Mock).mockResolvedValue(credential);
      (deps.repository.findCredentialByUuid as jest.Mock).mockResolvedValue(credential);

      const app = buildApp(deps);
      const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ tenantId: "1", email: credential.email, password: "correct-password" });
      const { mfaChallengeToken } = loginRes.body.data;

      const res = await request(app)
        .post("/api/v1/auth/mfa/verify")
        .send({ mfaChallengeToken, totpCode: "123456" });

      expect(res.status).toBe(200);
      expect(typeof res.body.data.accessToken).toBe("string");
    });

    it("returns 401 for a wrong TOTP code", async () => {
      const deps = buildDeps();
      const credential = buildUserCredential({ isMfaEnabled: true, mfaSecret: "SECRET", passwordHash: "hashed:correct-password" });
      (deps.repository.findCredentialByEmail as jest.Mock).mockResolvedValue(credential);
      (deps.repository.findCredentialByUuid as jest.Mock).mockResolvedValue(credential);
      (deps.repository.incrementFailedLoginAttempts as jest.Mock).mockResolvedValue(credential);

      const app = buildApp(deps);
      const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ tenantId: "1", email: credential.email, password: "correct-password" });
      const { mfaChallengeToken } = loginRes.body.data;

      const res = await request(app)
        .post("/api/v1/auth/mfa/verify")
        .send({ mfaChallengeToken, totpCode: "000000" });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTH_INVALID_CREDENTIALS");
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    it("returns 401 when no refresh-token cookie is present", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).post("/api/v1/auth/refresh");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTH_INVALID_REFRESH_TOKEN");
    });

    it("issues a new access token for a valid session", async () => {
      const deps = buildDeps();
      const credential = buildUserCredential({ isMfaEnabled: false, passwordHash: "hashed:correct-password" });
      (deps.repository.findCredentialByEmail as jest.Mock).mockResolvedValue(credential);

      const app = buildApp(deps);
      const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ tenantId: "1", email: credential.email, password: "correct-password" });
      const setCookie = loginRes.headers["set-cookie"] as unknown as string[];
      const refreshCookie = setCookie.find((c) => c.startsWith("refreshToken="))!.split(";")[0];

      (deps.repository.findValidRefreshToken as jest.Mock).mockResolvedValue({ id: 1n, tenantId: 1n });

      const res = await request(app).post("/api/v1/auth/refresh").set("Cookie", refreshCookie);

      expect(res.status).toBe(200);
      expect(typeof res.body.data.accessToken).toBe("string");
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("returns 401 when no refresh-token cookie is present", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).post("/api/v1/auth/logout");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTH_INVALID_REFRESH_TOKEN");
    });

    it("revokes the session and clears the cookie for a valid session", async () => {
      const deps = buildDeps();
      const credential = buildUserCredential({ isMfaEnabled: false, passwordHash: "hashed:correct-password" });
      (deps.repository.findCredentialByEmail as jest.Mock).mockResolvedValue(credential);

      const app = buildApp(deps);
      const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ tenantId: "1", email: credential.email, password: "correct-password" });
      const setCookie = loginRes.headers["set-cookie"] as unknown as string[];
      const refreshCookie = setCookie.find((c) => c.startsWith("refreshToken="))!.split(";")[0];

      (deps.repository.findValidRefreshToken as jest.Mock).mockResolvedValue({ id: 1n, tenantId: 1n });

      const res = await request(app).post("/api/v1/auth/logout").set("Cookie", refreshCookie);

      expect(res.status).toBe(204);
      expect(deps.repository.revokeRefreshToken).toHaveBeenCalledWith(1n, 1n);
    });
  });

  describe("POST /api/v1/auth/forgot-password", () => {
    it("always returns the identical generic message", async () => {
      const deps = buildDeps();
      (deps.repository.findCredentialByEmail as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .post("/api/v1/auth/forgot-password")
        .send({ tenantId: "1", email: "nobody@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe("If an account with that email exists, a password reset link has been sent.");
      expect(deps.repository.createPasswordResetToken).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/auth/reset-password", () => {
    it("returns 422 for a policy-violating new password", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/auth/reset-password")
        .send({ tenantId: "1", token: "a".repeat(64), newPassword: "short" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("AUTH_PASSWORD_POLICY_VIOLATION");
    });

    it("returns 422 when the reset token does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findPasswordResetToken as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .post("/api/v1/auth/reset-password")
        .send({ tenantId: "1", token: "a".repeat(64), newPassword: "a-valid-new-password" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("AUTH_INVALID_RESET_TOKEN");
    });
  });
});
