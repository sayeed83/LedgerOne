// Presentation-layer integration tests — exercise the real Express router
// end-to-end with a fake Repository (05_CODING_STANDARDS.md Ch.10.6) so no
// database cost is needed. No live `app`/server mount is exercised here
// (see test/integration/server.spec.ts for that) — the router is exercised
// directly via supertest wrapped in a bare Express instance, mirroring
// Organization's and User Management's own integration tests.
import express from "express";
import request from "supertest";
import { createAuthorizationRouter } from "../../../src/shared/authorization";
import { AuthorizationDependencies } from "../../../src/shared/authorization/business/authorization.composition";
import { RoleStatus } from "../../../src/shared/authorization/domain/enums/role-status.enum";
import { PermissionAction } from "../../../src/shared/authorization/domain/enums/permission-action.enum";
import {
  RolePermissionNotFoundError,
  UserRoleNotFoundError,
} from "../../../src/shared/authorization/domain/errors/authorization.errors";
import {
  buildRole,
  buildPermission,
  buildRolePermission,
  buildUserRole,
  createFakeAuthorizationRepository,
} from "../../../src/shared/authorization/business/test-support/fixtures";

function buildApp(deps: AuthorizationDependencies) {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/authorization", createAuthorizationRouter(deps));
  return app;
}

function buildDeps(): AuthorizationDependencies {
  return { repository: createFakeAuthorizationRepository() };
}

const TENANT_HEADER = "1";
const USER_UUID = "00000000-0000-0000-0000-000000000099";

describe("Authorization routes", () => {
  describe("POST /api/v1/authorization/roles", () => {
    it("returns 422 when the X-Tenant-Id header is missing", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).post("/api/v1/authorization/roles").send({ name: "Accountant" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/authorization/roles")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 409 when the role name is already in use within the tenant", async () => {
      const deps = buildDeps();
      (deps.repository.findRoleByName as jest.Mock).mockResolvedValue(buildRole());

      const res = await request(buildApp(deps))
        .post("/api/v1/authorization/roles")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "Accountant" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("AUTHZ_DUPLICATE_ROLE_NAME");
    });

    it("returns 201 with the created role, exposing only its uuid (never id/tenantId/createdBy)", async () => {
      const deps = buildDeps();
      (deps.repository.findRoleByName as jest.Mock).mockResolvedValue(null);
      const created = buildRole({ name: "Accountant", description: "Standard accounting role" });
      (deps.repository.createRole as jest.Mock).mockResolvedValue(created);

      const res = await request(buildApp(deps))
        .post("/api/v1/authorization/roles")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "Accountant", description: "Standard accounting role" });

      expect(res.status).toBe(201);
      expect(res.body.data.uuid).toBe(created.uuid);
      expect(res.body.data.name).toBe("Accountant");
      expect(res.body.data.status).toBe(RoleStatus.Active);
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.tenantId).toBeUndefined();
      expect(res.body.data.createdBy).toBeUndefined();
      expect(res.body.data.updatedBy).toBeUndefined();
      expect(res.body.data.deletedAt).toBeUndefined();
    });

    it("never exposes isSystemRole as client-controllable (always created as a custom, non-system role)", async () => {
      const deps = buildDeps();
      (deps.repository.findRoleByName as jest.Mock).mockResolvedValue(null);
      (deps.repository.createRole as jest.Mock).mockResolvedValue(buildRole({ isSystemRole: false }));

      await request(buildApp(deps))
        .post("/api/v1/authorization/roles")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "Accountant", isSystemRole: true });

      expect(deps.repository.createRole).toHaveBeenCalledWith(1n, {
        name: "Accountant",
        description: null,
        isSystemRole: false,
        createdBy: null,
      });
    });
  });

  describe("GET /api/v1/authorization/roles", () => {
    it("returns 422 when the X-Tenant-Id header is missing", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get("/api/v1/authorization/roles");

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 200 with the tenant's roles as an array", async () => {
      const deps = buildDeps();
      const roles = [buildRole()];
      (deps.repository.listRoles as jest.Mock).mockResolvedValue(roles);

      const res = await request(buildApp(deps)).get("/api/v1/authorization/roles").set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].uuid).toBe(roles[0].uuid);
    });
  });

  describe("GET /api/v1/authorization/roles/:roleUuid", () => {
    it("returns 422 for a malformed uuid", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .get("/api/v1/authorization/roles/not-a-uuid")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the role does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .get(`/api/v1/authorization/roles/${buildRole().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("AUTHZ_ROLE_NOT_FOUND");
    });

    it("returns 200 with the role", async () => {
      const deps = buildDeps();
      const role = buildRole();
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);

      const res = await request(buildApp(deps))
        .get(`/api/v1/authorization/roles/${role.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data.uuid).toBe(role.uuid);
      expect(res.body.data.name).toBe(role.name);
    });
  });

  describe("PUT /api/v1/authorization/roles/:roleUuid", () => {
    it("returns 404 when the role does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .put(`/api/v1/authorization/roles/${buildRole().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ description: "Updated" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("AUTHZ_ROLE_NOT_FOUND");
    });

    it("returns 409 when the new name is already in use by another role", async () => {
      const deps = buildDeps();
      const role = buildRole();
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
      (deps.repository.findRoleByName as jest.Mock).mockResolvedValue(
        buildRole({ uuid: "00000000-0000-0000-0000-000000000098", name: "Sales Manager" }),
      );

      const res = await request(buildApp(deps))
        .put(`/api/v1/authorization/roles/${role.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "Sales Manager" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("AUTHZ_DUPLICATE_ROLE_NAME");
    });

    it("returns 200 with the updated role", async () => {
      const deps = buildDeps();
      const role = buildRole();
      const updated = buildRole({ description: "Updated" });
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
      (deps.repository.updateRole as jest.Mock).mockResolvedValue(updated);

      const res = await request(buildApp(deps))
        .put(`/api/v1/authorization/roles/${role.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ description: "Updated" });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe("Updated");
    });
  });

  describe("POST /api/v1/authorization/roles/:roleUuid/retire", () => {
    it("returns 200 when the transition is legal", async () => {
      const deps = buildDeps();
      const role = buildRole({ status: RoleStatus.Active });
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
      (deps.repository.retireRole as jest.Mock).mockResolvedValue(buildRole({ status: RoleStatus.Retired }));

      const res = await request(buildApp(deps))
        .post(`/api/v1/authorization/roles/${role.uuid}/retire`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(RoleStatus.Retired);
    });

    it("returns 409 when the role is already Retired", async () => {
      const deps = buildDeps();
      const role = buildRole({ status: RoleStatus.Retired });
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);

      const res = await request(buildApp(deps))
        .post(`/api/v1/authorization/roles/${role.uuid}/retire`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("AUTHZ_INVALID_ROLE_STATUS_TRANSITION");
    });

    it("returns 404 when the role does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .post(`/api/v1/authorization/roles/${buildRole().uuid}/retire`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("AUTHZ_ROLE_NOT_FOUND");
    });
  });

  describe("GET /api/v1/authorization/permissions", () => {
    it("returns 200 with every permission, with no X-Tenant-Id header required", async () => {
      const deps = buildDeps();
      const permissions = [buildPermission()];
      (deps.repository.listPermissions as jest.Mock).mockResolvedValue(permissions);

      const res = await request(buildApp(deps)).get("/api/v1/authorization/permissions");

      expect(res.status).toBe(200);
      expect(res.body.data[0].permissionKey).toBe(permissions[0].permissionKey);
      expect(res.body.data[0].id).toBeUndefined();
    });

    it("filters by ?moduleName= when given", async () => {
      const deps = buildDeps();
      (deps.repository.listPermissionsByModule as jest.Mock).mockResolvedValue([
        buildPermission({ moduleName: "accounting" }),
      ]);

      const res = await request(buildApp(deps)).get("/api/v1/authorization/permissions").query({ moduleName: "accounting" });

      expect(res.status).toBe(200);
      expect(deps.repository.listPermissionsByModule).toHaveBeenCalledWith("accounting");
      expect(deps.repository.listPermissions).not.toHaveBeenCalled();
    });

    it("exposes action as its string enum value in the response DTO", async () => {
      const deps = buildDeps();
      (deps.repository.listPermissions as jest.Mock).mockResolvedValue([
        buildPermission({ action: PermissionAction.Approve }),
      ]);

      const res = await request(buildApp(deps)).get("/api/v1/authorization/permissions");

      expect(res.body.data[0].action).toBe(PermissionAction.Approve);
    });
  });

  describe("GET /api/v1/authorization/roles/:roleUuid/permissions", () => {
    it("returns 404 when the role does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .get(`/api/v1/authorization/roles/${buildRole().uuid}/permissions`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("AUTHZ_ROLE_NOT_FOUND");
    });

    it("returns 200 with the granted permissions", async () => {
      const deps = buildDeps();
      const role = buildRole();
      const permissions = [buildPermission()];
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
      (deps.repository.listPermissionsForRole as jest.Mock).mockResolvedValue(permissions);

      const res = await request(buildApp(deps))
        .get(`/api/v1/authorization/roles/${role.uuid}/permissions`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data[0].permissionKey).toBe(permissions[0].permissionKey);
    });
  });

  describe("POST /api/v1/authorization/roles/:roleUuid/permissions", () => {
    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post(`/api/v1/authorization/roles/${buildRole().uuid}/permissions`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({});

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the role does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .post(`/api/v1/authorization/roles/${buildRole().uuid}/permissions`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ permissionKey: "accounting.journal_entry.post" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("AUTHZ_ROLE_NOT_FOUND");
    });

    it("returns 404 when the permission does not exist", async () => {
      const deps = buildDeps();
      const role = buildRole();
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
      (deps.repository.findPermissionByKey as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .post(`/api/v1/authorization/roles/${role.uuid}/permissions`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ permissionKey: "nonexistent.key.nope" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("AUTHZ_PERMISSION_NOT_FOUND");
    });

    it("returns 409 when the permission is already granted to the role", async () => {
      const deps = buildDeps();
      const role = buildRole();
      const permission = buildPermission();
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
      (deps.repository.findPermissionByKey as jest.Mock).mockResolvedValue(permission);
      (deps.repository.listPermissionsForRole as jest.Mock).mockResolvedValue([permission]);

      const res = await request(buildApp(deps))
        .post(`/api/v1/authorization/roles/${role.uuid}/permissions`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ permissionKey: permission.permissionKey });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("AUTHZ_DUPLICATE_PERMISSION_ASSIGNMENT");
    });

    it("returns 201 with the grant, exposing roleUuid/permissionKey but never internal roleId/permissionId", async () => {
      const deps = buildDeps();
      const role = buildRole();
      const permission = buildPermission();
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
      (deps.repository.findPermissionByKey as jest.Mock).mockResolvedValue(permission);
      (deps.repository.listPermissionsForRole as jest.Mock).mockResolvedValue([]);
      (deps.repository.assignPermissionToRole as jest.Mock).mockResolvedValue(buildRolePermission());

      const res = await request(buildApp(deps))
        .post(`/api/v1/authorization/roles/${role.uuid}/permissions`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ permissionKey: permission.permissionKey });

      expect(res.status).toBe(201);
      expect(res.body.data.roleUuid).toBe(role.uuid);
      expect(res.body.data.permissionKey).toBe(permission.permissionKey);
      expect(res.body.data.roleId).toBeUndefined();
      expect(res.body.data.permissionId).toBeUndefined();
    });
  });

  describe("DELETE /api/v1/authorization/roles/:roleUuid/permissions/:permissionKey", () => {
    it("returns 404 when the role does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .delete(`/api/v1/authorization/roles/${buildRole().uuid}/permissions/accounting.journal_entry.post`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("AUTHZ_ROLE_NOT_FOUND");
    });

    it("returns 404 when the grant does not exist", async () => {
      const deps = buildDeps();
      const role = buildRole();
      const permission = buildPermission();
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
      (deps.repository.findPermissionByKey as jest.Mock).mockResolvedValue(permission);
      (deps.repository.removePermissionFromRole as jest.Mock).mockRejectedValue(
        new RolePermissionNotFoundError(role.id.toString(), permission.id.toString()),
      );

      const res = await request(buildApp(deps))
        .delete(`/api/v1/authorization/roles/${role.uuid}/permissions/${permission.permissionKey}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("AUTHZ_ROLE_PERMISSION_NOT_FOUND");
    });

    it("returns 204 with no body on success", async () => {
      const deps = buildDeps();
      const role = buildRole();
      const permission = buildPermission();
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
      (deps.repository.findPermissionByKey as jest.Mock).mockResolvedValue(permission);
      (deps.repository.removePermissionFromRole as jest.Mock).mockResolvedValue(undefined);

      const res = await request(buildApp(deps))
        .delete(`/api/v1/authorization/roles/${role.uuid}/permissions/${permission.permissionKey}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
    });
  });

  describe("GET /api/v1/authorization/users/:userUuid/roles", () => {
    it("returns 200 with the user's assigned roles", async () => {
      const deps = buildDeps();
      const roles = [buildRole()];
      (deps.repository.listRolesForUser as jest.Mock).mockResolvedValue(roles);

      const res = await request(buildApp(deps))
        .get(`/api/v1/authorization/users/${USER_UUID}/roles`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data[0].uuid).toBe(roles[0].uuid);
    });
  });

  describe("POST /api/v1/authorization/users/:userUuid/roles", () => {
    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post(`/api/v1/authorization/users/${USER_UUID}/roles`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ roleUuid: "not-a-uuid" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the role does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .post(`/api/v1/authorization/users/${USER_UUID}/roles`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ roleUuid: buildRole().uuid });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("AUTHZ_ROLE_NOT_FOUND");
    });

    it("returns 403 when the role is Retired (not assignable to a new User)", async () => {
      const deps = buildDeps();
      const role = buildRole({ status: RoleStatus.Retired });
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);

      const res = await request(buildApp(deps))
        .post(`/api/v1/authorization/users/${USER_UUID}/roles`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ roleUuid: role.uuid });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("AUTHZ_ROLE_NOT_ASSIGNABLE");
    });

    it("returns 409 when the user already holds the role", async () => {
      const deps = buildDeps();
      const role = buildRole({ status: RoleStatus.Active });
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
      (deps.repository.listRolesForUser as jest.Mock).mockResolvedValue([role]);

      const res = await request(buildApp(deps))
        .post(`/api/v1/authorization/users/${USER_UUID}/roles`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ roleUuid: role.uuid });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("AUTHZ_DUPLICATE_ROLE_ASSIGNMENT");
    });

    it("returns 201 with the assignment, exposing userUuid/roleUuid but never internal roleId", async () => {
      const deps = buildDeps();
      const role = buildRole({ status: RoleStatus.Active });
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
      (deps.repository.listRolesForUser as jest.Mock).mockResolvedValue([]);
      (deps.repository.assignRoleToUser as jest.Mock).mockResolvedValue(buildUserRole({ userUuid: USER_UUID }));

      const res = await request(buildApp(deps))
        .post(`/api/v1/authorization/users/${USER_UUID}/roles`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ roleUuid: role.uuid });

      expect(res.status).toBe(201);
      expect(res.body.data.userUuid).toBe(USER_UUID);
      expect(res.body.data.roleUuid).toBe(role.uuid);
      expect(res.body.data.roleId).toBeUndefined();
    });
  });

  describe("DELETE /api/v1/authorization/users/:userUuid/roles/:roleUuid", () => {
    it("returns 404 when the role does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .delete(`/api/v1/authorization/users/${USER_UUID}/roles/${buildRole().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("AUTHZ_ROLE_NOT_FOUND");
    });

    it("returns 404 when the assignment does not exist", async () => {
      const deps = buildDeps();
      const role = buildRole();
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
      (deps.repository.removeRoleFromUser as jest.Mock).mockRejectedValue(
        new UserRoleNotFoundError(USER_UUID, role.uuid),
      );

      const res = await request(buildApp(deps))
        .delete(`/api/v1/authorization/users/${USER_UUID}/roles/${role.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("AUTHZ_USER_ROLE_NOT_FOUND");
    });

    it("returns 204 with no body on success", async () => {
      const deps = buildDeps();
      const role = buildRole();
      (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
      (deps.repository.removeRoleFromUser as jest.Mock).mockResolvedValue(undefined);

      const res = await request(buildApp(deps))
        .delete(`/api/v1/authorization/users/${USER_UUID}/roles/${role.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
    });
  });
});
