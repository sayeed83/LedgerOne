// Integration test for the actual bootstrapped application
// (apps/api/src/server.ts) — exercises the real `createApp()` (real
// Prisma/JWT/Argon2/Speakeasy dependencies, real dev database from `.env`)
// via supertest, without ever calling `.listen()`.
import request from "supertest";
import { createApp } from "../../src/server";

const app = createApp();

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

  describe("Tenant", () => {
    it("POST /api/v1/organization/tenants validates its body", async () => {
      const res = await request(app).post("/api/v1/organization/tenants").send({ legalName: "" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("GET /api/v1/organization/tenants/:tenantUuid returns 404 for a nonexistent tenant", async () => {
      const res = await request(app).get(`/api/v1/organization/tenants/${nonexistentUuid}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_TENANT_NOT_FOUND");
    });
  });

  describe("Company", () => {
    it("POST /api/v1/organization/companies requires the X-Tenant-Id header", async () => {
      const res = await request(app).post("/api/v1/organization/companies").send({ companyCode: "CO-001" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("GET /api/v1/organization/companies/:companyUuid returns 404 for a nonexistent tenant", async () => {
      const res = await request(app)
        .get(`/api/v1/organization/companies/${nonexistentUuid}`)
        .set("X-Tenant-Id", nonexistentUuid);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_TENANT_NOT_FOUND");
    });

    it("GET /api/v1/organization/tenants/:tenantUuid/companies returns 404 for a nonexistent tenant", async () => {
      const res = await request(app).get(`/api/v1/organization/tenants/${nonexistentUuid}/companies`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_TENANT_NOT_FOUND");
    });
  });

  describe("Branch", () => {
    it("POST /api/v1/organization/branches requires the X-Tenant-Id header", async () => {
      const res = await request(app).post("/api/v1/organization/branches").send({ branchCode: "BR-001" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("GET /api/v1/organization/branches/:branchUuid returns 404 for a nonexistent tenant", async () => {
      const res = await request(app)
        .get(`/api/v1/organization/branches/${nonexistentUuid}`)
        .set("X-Tenant-Id", nonexistentUuid);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_TENANT_NOT_FOUND");
    });

    it("GET /api/v1/organization/companies/:companyUuid/branches returns 404 for a nonexistent tenant", async () => {
      const res = await request(app)
        .get(`/api/v1/organization/companies/${nonexistentUuid}/branches`)
        .set("X-Tenant-Id", nonexistentUuid);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_TENANT_NOT_FOUND");
    });
  });

  describe("Department", () => {
    it("POST /api/v1/organization/departments requires the X-Tenant-Id header", async () => {
      const res = await request(app).post("/api/v1/organization/departments").send({ departmentCode: "DPT-001" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("GET /api/v1/organization/departments/:departmentUuid returns 404 for a nonexistent tenant", async () => {
      const res = await request(app)
        .get(`/api/v1/organization/departments/${nonexistentUuid}`)
        .set("X-Tenant-Id", nonexistentUuid);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_TENANT_NOT_FOUND");
    });

    it("GET /api/v1/organization/companies/:companyUuid/departments returns 404 for a nonexistent tenant", async () => {
      const res = await request(app)
        .get(`/api/v1/organization/companies/${nonexistentUuid}/departments`)
        .set("X-Tenant-Id", nonexistentUuid);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_TENANT_NOT_FOUND");
    });
  });
});

describe("User Management routes are mounted on the real app", () => {
  const nonexistentTenantId = "999999";
  const nonexistentUuid = "00000000-0000-0000-0000-000000000000";

  it("POST /api/v1/users requires the X-Tenant-Id header", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .send({ companyUuid: nonexistentUuid, firstName: "Test", lastName: "User", email: "test@example.com" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("GET /api/v1/users/:userUuid returns 404 for a nonexistent user", async () => {
    const res = await request(app)
      .get(`/api/v1/users/${nonexistentUuid}`)
      .set("X-Tenant-Id", nonexistentTenantId);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("USR_USER_NOT_FOUND");
  });

  it("GET /api/v1/users returns 200 with an empty list for a tenant with no users", async () => {
    const res = await request(app).get("/api/v1/users").set("X-Tenant-Id", nonexistentTenantId);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
