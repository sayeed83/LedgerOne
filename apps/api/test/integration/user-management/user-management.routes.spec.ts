// Presentation-layer integration tests — exercise the real Express router
// end-to-end with a fake Repository (05_CODING_STANDARDS.md Ch.10.6) so no
// database cost is needed. No live `app`/server mount is exercised here
// (see test/integration/server.spec.ts for that) — the router is exercised
// directly via supertest wrapped in a bare Express instance, mirroring
// Organization's own integration test.
import express from "express";
import request from "supertest";
import { createUserManagementRouter } from "../../../src/shared/user-management";
import { UserManagementDependencies } from "../../../src/shared/user-management/business/user-management.composition";
import { UserStatus } from "../../../src/shared/user-management/domain/enums/user-status.enum";
import { buildUser, createFakeUserManagementRepository } from "../../../src/shared/user-management/business/test-support/fixtures";

function buildApp(deps: UserManagementDependencies) {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/users", createUserManagementRouter(deps));
  return app;
}

function buildDeps(): UserManagementDependencies {
  return { repository: createFakeUserManagementRepository() };
}

const TENANT_HEADER = "1";
const validCreateBody = {
  companyUuid: "00000000-0000-0000-0000-000000000010",
  firstName: "Arjun",
  lastName: "Mehta",
  email: "arjun.mehta@example.com",
};

describe("User Management routes", () => {
  describe("POST /api/v1/users", () => {
    it("returns 422 when the X-Tenant-Id header is missing", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).post("/api/v1/users").send(validCreateBody);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/users")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ companyUuid: "not-a-uuid", firstName: "", lastName: "Mehta", email: "not-an-email" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 409 when the email is already in use within the tenant", async () => {
      const deps = buildDeps();
      (deps.repository.findUserByEmail as jest.Mock).mockResolvedValue(buildUser());

      const res = await request(buildApp(deps))
        .post("/api/v1/users")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send(validCreateBody);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("USR_DUPLICATE_EMAIL");
    });

    it("returns 201 with the created user, exposing only its uuid (never id/tenantId)", async () => {
      const deps = buildDeps();
      (deps.repository.findUserByEmail as jest.Mock).mockResolvedValue(null);
      const created = buildUser({ email: validCreateBody.email, firstName: "Arjun", lastName: "Mehta" });
      (deps.repository.createUser as jest.Mock).mockResolvedValue(created);

      const res = await request(buildApp(deps))
        .post("/api/v1/users")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send(validCreateBody);

      expect(res.status).toBe(201);
      expect(res.body.data.uuid).toBe(created.uuid);
      expect(res.body.data.email).toBe(validCreateBody.email);
      expect(res.body.data.status).toBe(UserStatus.Invited);
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.tenantId).toBeUndefined();
      expect(res.body.data.createdBy).toBeUndefined();
      expect(res.body.data.deletedAt).toBeUndefined();
    });
  });

  describe("POST /api/v1/users/invite", () => {
    it("returns 409 when the email is already in use within the tenant", async () => {
      const deps = buildDeps();
      (deps.repository.findUserByEmail as jest.Mock).mockResolvedValue(buildUser());

      const res = await request(buildApp(deps))
        .post("/api/v1/users/invite")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send(validCreateBody);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("USR_DUPLICATE_EMAIL");
    });

    it("returns 201 with the invited (Invited-status) user", async () => {
      const deps = buildDeps();
      (deps.repository.findUserByEmail as jest.Mock).mockResolvedValue(null);
      (deps.repository.createUser as jest.Mock).mockResolvedValue(buildUser({ status: UserStatus.Invited }));

      const res = await request(buildApp(deps))
        .post("/api/v1/users/invite")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send(validCreateBody);

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe(UserStatus.Invited);
    });
  });

  describe("GET /api/v1/users/:userUuid", () => {
    it("returns 422 for a malformed uuid", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .get("/api/v1/users/not-a-uuid")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the user does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .get(`/api/v1/users/${buildUser().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("USR_USER_NOT_FOUND");
    });

    it("returns 200 with the user", async () => {
      const deps = buildDeps();
      const user = buildUser();
      (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);

      const res = await request(buildApp(deps))
        .get(`/api/v1/users/${user.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data.uuid).toBe(user.uuid);
      expect(res.body.data.firstName).toBe(user.firstName);
    });
  });

  describe("PUT /api/v1/users/:userUuid", () => {
    it("returns 404 when the user does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .put(`/api/v1/users/${buildUser().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ displayName: "New Name" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("USR_USER_NOT_FOUND");
    });

    it("returns 409 when the new email is already in use by another user", async () => {
      const deps = buildDeps();
      const user = buildUser();
      (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);
      (deps.repository.findUserByEmail as jest.Mock).mockResolvedValue(
        buildUser({ uuid: "00000000-0000-0000-0000-000000000099", email: "taken@example.com" }),
      );

      const res = await request(buildApp(deps))
        .put(`/api/v1/users/${user.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ email: "taken@example.com" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("USR_DUPLICATE_EMAIL");
    });

    it("returns 200 with the updated user", async () => {
      const deps = buildDeps();
      const user = buildUser();
      const updated = buildUser({ displayName: "Priya S." });
      (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);
      (deps.repository.updateUser as jest.Mock).mockResolvedValue(updated);

      const res = await request(buildApp(deps))
        .put(`/api/v1/users/${user.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ displayName: "Priya S." });

      expect(res.status).toBe(200);
      expect(res.body.data.displayName).toBe("Priya S.");
    });
  });

  describe("POST /api/v1/users/:userUuid/activate", () => {
    it("returns 200 when the transition is legal", async () => {
      const deps = buildDeps();
      const user = buildUser({ status: UserStatus.Invited });
      (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);
      (deps.repository.activateUser as jest.Mock).mockResolvedValue(buildUser({ status: UserStatus.Active }));

      const res = await request(buildApp(deps))
        .post(`/api/v1/users/${user.uuid}/activate`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(UserStatus.Active);
    });

    it("returns 409 when the transition is illegal", async () => {
      const deps = buildDeps();
      const user = buildUser({ status: UserStatus.Active });
      (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);

      const res = await request(buildApp(deps))
        .post(`/api/v1/users/${user.uuid}/activate`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("USR_INVALID_STATUS_TRANSITION");
    });
  });

  describe("POST /api/v1/users/:userUuid/suspend", () => {
    it("returns 200 when the transition is legal", async () => {
      const deps = buildDeps();
      const user = buildUser({ status: UserStatus.Active });
      (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);
      (deps.repository.suspendUser as jest.Mock).mockResolvedValue(buildUser({ status: UserStatus.Suspended }));

      const res = await request(buildApp(deps))
        .post(`/api/v1/users/${user.uuid}/suspend`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(UserStatus.Suspended);
    });

    it("returns 409 when the transition is illegal", async () => {
      const deps = buildDeps();
      const user = buildUser({ status: UserStatus.Invited });
      (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);

      const res = await request(buildApp(deps))
        .post(`/api/v1/users/${user.uuid}/suspend`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("USR_INVALID_STATUS_TRANSITION");
    });
  });

  describe("POST /api/v1/users/:userUuid/deactivate", () => {
    it("returns 200 when the transition is legal", async () => {
      const deps = buildDeps();
      const user = buildUser({ status: UserStatus.Active });
      (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);
      (deps.repository.deactivateUser as jest.Mock).mockResolvedValue(
        buildUser({ status: UserStatus.Deactivated }),
      );

      const res = await request(buildApp(deps))
        .post(`/api/v1/users/${user.uuid}/deactivate`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(UserStatus.Deactivated);
    });

    it("returns 404 when the user does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .post(`/api/v1/users/${buildUser().uuid}/deactivate`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("USR_USER_NOT_FOUND");
    });
  });

  describe("GET /api/v1/users", () => {
    it("returns 422 when the X-Tenant-Id header is missing", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get("/api/v1/users");

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 200 with the tenant's users as an array", async () => {
      const deps = buildDeps();
      const users = [buildUser()];
      (deps.repository.listUsersByTenant as jest.Mock).mockResolvedValue(users);

      const res = await request(buildApp(deps)).get("/api/v1/users").set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].uuid).toBe(users[0].uuid);
    });

    it("lists by company when ?companyUuid= is given", async () => {
      const deps = buildDeps();
      (deps.repository.listUsersByCompany as jest.Mock).mockResolvedValue([]);

      const res = await request(buildApp(deps))
        .get("/api/v1/users")
        .query({ companyUuid: "00000000-0000-0000-0000-000000000010" })
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(deps.repository.listUsersByCompany).toHaveBeenCalledWith(1n, "00000000-0000-0000-0000-000000000010");
    });
  });

  describe("GET /api/v1/users/search", () => {
    it("returns 422 when the query param is missing", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get("/api/v1/users/search").set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 200 with matching users", async () => {
      const deps = buildDeps();
      const users = [buildUser({ lastName: "Mehta" })];
      (deps.repository.searchUsers as jest.Mock).mockResolvedValue(users);

      const res = await request(buildApp(deps))
        .get("/api/v1/users/search")
        .query({ query: "Mehta" })
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data[0].lastName).toBe("Mehta");
      expect(deps.repository.searchUsers).toHaveBeenCalledWith(1n, "Mehta");
    });
  });
});
