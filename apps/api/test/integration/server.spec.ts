// Integration test for the actual bootstrapped application
// (apps/api/src/server.ts) — exercises the real `createApp()` (real
// Prisma/JWT/Argon2/Speakeasy dependencies, real dev database from `.env`)
// via supertest, without ever calling `.listen()`.
import request from "supertest";
import { createApp } from "../../src/server";
import { createAuthenticationDependencies } from "../../src/shared/authentication/business/authentication.composition";

const app = createApp();

// Organization, User Management, and Authorization now sit behind
// jwt-auth.middleware.ts (module-registry.ts) — a Foundation Hardening
// Sprint fix for 09_SECURITY_GUIDELINES.md MTS-001. jwt-auth only verifies
// the token's signature/expiry; it never looks the user up in the
// database, so minting one directly via the real token issuer (same
// signing keys `.env` already provides, loaded by `createApp()` itself) is
// sufficient here — no need to actually call `/auth/login` first.
const TEST_USER_UUID = "00000000-0000-0000-0000-000000000001";

function issueAccessTokenFor(tenantId: string): string {
  const { tokenIssuer } = createAuthenticationDependencies();
  return tokenIssuer.issueAccessToken({ sub: TEST_USER_UUID, tenantId });
}

describe("GET /health", () => {
  it("returns 200 {status: 'ok'} when the database is reachable", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("Authentication routes are mounted on the real app", () => {
  it("POST /api/v1/auth/login validates its body", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({ tenantId: "1", email: "not-an-email" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /api/v1/auth/login returns 401 for a nonexistent account", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ tenantId: "999999", email: "no-such-user@example.com", password: "whatever-password" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTH_INVALID_CREDENTIALS");
  });

  it("POST /api/v1/auth/mfa/verify rejects a malformed challenge token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/mfa/verify")
      .send({ mfaChallengeToken: "not-a-real-token", totpCode: "123456" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTH_MFA_CHALLENGE_INVALID");
  });

  it("POST /api/v1/auth/refresh returns 401 with no refresh-token cookie", async () => {
    const res = await request(app).post("/api/v1/auth/refresh");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTH_INVALID_REFRESH_TOKEN");
  });

  it("POST /api/v1/auth/logout returns 401 with no refresh-token cookie", async () => {
    const res = await request(app).post("/api/v1/auth/logout");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTH_INVALID_REFRESH_TOKEN");
  });

  it("POST /api/v1/auth/forgot-password always returns the identical generic message", async () => {
    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ tenantId: "999999", email: "no-such-user@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe("If an account with that email exists, a password reset link has been sent.");
  });

  it("POST /api/v1/auth/reset-password returns 422 for a policy-violating password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({ tenantId: "1", token: "a".repeat(64), newPassword: "short" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("AUTH_PASSWORD_POLICY_VIOLATION");
  });
});

describe("Organization routes are mounted on the real app", () => {
  const nonexistentUuid = "00000000-0000-0000-0000-000000000000";
  // Organization's mount doesn't rewrite X-Tenant-Id (current-tenant.middleware.ts
  // still can't resolve a tenant uuid from the JWT's numeric tenantId claim
  // alone — see that file's header comment) — any authenticated caller is
  // accepted, and Organization's own uuid-header validation is unchanged.
  const authHeader = `Bearer ${issueAccessTokenFor("1")}`;

  it("rejects every route below with 401 when no Authorization token is provided", async () => {
    const res = await request(app).post("/api/v1/organization/tenants").send({ legalName: "Acme" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTH_MISSING_TOKEN");
  });

  describe("Tenant", () => {
    it("POST /api/v1/organization/tenants validates its body", async () => {
      const res = await request(app)
        .post("/api/v1/organization/tenants")
        .set("Authorization", authHeader)
        .send({ legalName: "" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("GET /api/v1/organization/tenants/:tenantUuid returns 404 for a nonexistent tenant", async () => {
      const res = await request(app)
        .get(`/api/v1/organization/tenants/${nonexistentUuid}`)
        .set("Authorization", authHeader);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_TENANT_NOT_FOUND");
    });
  });

  describe("Company", () => {
    it("POST /api/v1/organization/companies requires the X-Tenant-Id header", async () => {
      const res = await request(app)
        .post("/api/v1/organization/companies")
        .set("Authorization", authHeader)
        .send({ companyCode: "CO-001" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("GET /api/v1/organization/companies/:companyUuid returns 404 for a nonexistent tenant", async () => {
      const res = await request(app)
        .get(`/api/v1/organization/companies/${nonexistentUuid}`)
        .set("Authorization", authHeader)
        .set("X-Tenant-Id", nonexistentUuid);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_TENANT_NOT_FOUND");
    });

    it("GET /api/v1/organization/tenants/:tenantUuid/companies returns 404 for a nonexistent tenant", async () => {
      const res = await request(app)
        .get(`/api/v1/organization/tenants/${nonexistentUuid}/companies`)
        .set("Authorization", authHeader);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_TENANT_NOT_FOUND");
    });
  });

  describe("Branch", () => {
    it("POST /api/v1/organization/branches requires the X-Tenant-Id header", async () => {
      const res = await request(app)
        .post("/api/v1/organization/branches")
        .set("Authorization", authHeader)
        .send({ branchCode: "BR-001" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("GET /api/v1/organization/branches/:branchUuid returns 404 for a nonexistent tenant", async () => {
      const res = await request(app)
        .get(`/api/v1/organization/branches/${nonexistentUuid}`)
        .set("Authorization", authHeader)
        .set("X-Tenant-Id", nonexistentUuid);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_TENANT_NOT_FOUND");
    });

    it("GET /api/v1/organization/companies/:companyUuid/branches returns 404 for a nonexistent tenant", async () => {
      const res = await request(app)
        .get(`/api/v1/organization/companies/${nonexistentUuid}/branches`)
        .set("Authorization", authHeader)
        .set("X-Tenant-Id", nonexistentUuid);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_TENANT_NOT_FOUND");
    });
  });

  describe("Department", () => {
    it("POST /api/v1/organization/departments requires the X-Tenant-Id header", async () => {
      const res = await request(app)
        .post("/api/v1/organization/departments")
        .set("Authorization", authHeader)
        .send({ departmentCode: "DPT-001" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("GET /api/v1/organization/departments/:departmentUuid returns 404 for a nonexistent tenant", async () => {
      const res = await request(app)
        .get(`/api/v1/organization/departments/${nonexistentUuid}`)
        .set("Authorization", authHeader)
        .set("X-Tenant-Id", nonexistentUuid);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_TENANT_NOT_FOUND");
    });

    it("GET /api/v1/organization/companies/:companyUuid/departments returns 404 for a nonexistent tenant", async () => {
      const res = await request(app)
        .get(`/api/v1/organization/companies/${nonexistentUuid}/departments`)
        .set("Authorization", authHeader)
        .set("X-Tenant-Id", nonexistentUuid);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_TENANT_NOT_FOUND");
    });
  });
});

describe("User Management routes are mounted on the real app", () => {
  const nonexistentTenantId = "999999";
  const nonexistentUuid = "00000000-0000-0000-0000-000000000000";
  // current-tenant.middleware.ts (mounted with `rewriteHeaderAs: "decimal"`
  // for this module) derives `X-Tenant-Id` from the verified JWT's tenantId
  // claim and overwrites any client-supplied value — so the token's claim,
  // not a header set on the request, is what the controller actually sees.
  const authHeaderFor = (tenantId: string) => `Bearer ${issueAccessTokenFor(tenantId)}`;

  it("returns 401 when no Authorization token is provided (previously: 422 for a missing X-Tenant-Id header — tenant context is now derived from the verified token, so an unauthenticated request never reaches body/header validation)", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .send({ companyUuid: nonexistentUuid, firstName: "Test", lastName: "User", email: "test@example.com" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTH_MISSING_TOKEN");
  });

  it("GET /api/v1/users/:userUuid returns 404 for a nonexistent user", async () => {
    const res = await request(app)
      .get(`/api/v1/users/${nonexistentUuid}`)
      .set("Authorization", authHeaderFor(nonexistentTenantId));

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("USR_USER_NOT_FOUND");
  });

  it("GET /api/v1/users returns 200 with an empty list for a tenant with no users", async () => {
    const res = await request(app).get("/api/v1/users").set("Authorization", authHeaderFor(nonexistentTenantId));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
