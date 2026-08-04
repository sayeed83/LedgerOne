import { Request, Response } from "express";
import { createPermissionMiddleware, PermissionChecker } from "./permission.middleware";

function buildRes() {
  const res = { status: jest.fn(), json: jest.fn() } as unknown as Response;
  (res.status as jest.Mock).mockReturnValue(res);
  return res;
}

describe("permission.middleware", () => {
  it("returns 500 PERMISSION_CONTEXT_MISCONFIGURED when req.user/req.tenantId are not set", async () => {
    const checker: PermissionChecker = { hasPermission: jest.fn() };
    const middleware = createPermissionMiddleware("accounting.journal_entry.post", checker);
    const req = { headers: {} } as Request;
    const res = buildRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: "PERMISSION_CONTEXT_MISCONFIGURED", message: expect.any(String) },
    });
    expect(next).not.toHaveBeenCalled();
    expect(checker.hasPermission).not.toHaveBeenCalled();
  });

  it("returns 403 AUTHZ_PERMISSION_DENIED when the checker reports false", async () => {
    const checker: PermissionChecker = { hasPermission: jest.fn().mockResolvedValue(false) };
    const middleware = createPermissionMiddleware("accounting.journal_entry.post", checker);
    const req = {
      headers: {},
      user: { userUuid: "u-1", tenantId: 1n, tokenId: "jti" },
      tenantId: 1n,
    } as Request;
    const res = buildRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(checker.hasPermission).toHaveBeenCalledWith({
      tenantId: 1n,
      userUuid: "u-1",
      permissionKey: "accounting.journal_entry.post",
    });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: { code: "AUTHZ_PERMISSION_DENIED", message: expect.any(String) } });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() when the checker reports true", async () => {
    const checker: PermissionChecker = { hasPermission: jest.fn().mockResolvedValue(true) };
    const middleware = createPermissionMiddleware("accounting.journal_entry.post", checker);
    const req = {
      headers: {},
      user: { userUuid: "u-1", tenantId: 1n, tokenId: "jti" },
      tenantId: 1n,
    } as Request;
    const res = buildRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("forwards unexpected checker errors to next(error) instead of swallowing them", async () => {
    const boom = new Error("db unreachable");
    const checker: PermissionChecker = { hasPermission: jest.fn().mockRejectedValue(boom) };
    const middleware = createPermissionMiddleware("accounting.journal_entry.post", checker);
    const req = {
      headers: {},
      user: { userUuid: "u-1", tenantId: 1n, tokenId: "jti" },
      tenantId: 1n,
    } as Request;
    const res = buildRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(boom);
    expect(res.status).not.toHaveBeenCalled();
  });
});
