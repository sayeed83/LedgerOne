import { Request, Response } from "express";
import { createCurrentTenantMiddleware } from "./current-tenant.middleware";

function buildRes() {
  const res = { status: jest.fn(), json: jest.fn() } as unknown as Response;
  (res.status as jest.Mock).mockReturnValue(res);
  return res;
}

describe("current-tenant.middleware", () => {
  it("returns 500 TENANT_CONTEXT_MISCONFIGURED when req.user is not set (jwt-auth didn't run first)", () => {
    const middleware = createCurrentTenantMiddleware();
    const req = { headers: {} } as Request;
    const res = buildRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: "TENANT_CONTEXT_MISCONFIGURED", message: expect.any(String) },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("derives req.tenantId from req.user and calls next(), without touching headers, by default", () => {
    const middleware = createCurrentTenantMiddleware();
    const req = {
      headers: { "x-tenant-id": "client-supplied-uuid-should-be-untouched" },
      user: { userUuid: "u-1", tenantId: 7n, tokenId: "jti" },
    } as unknown as Request;
    const res = buildRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(req.tenantId).toBe(7n);
    expect(req.headers["x-tenant-id"]).toBe("client-supplied-uuid-should-be-untouched");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("overwrites the x-tenant-id header with the verified decimal tenantId when rewriteHeaderAs: 'decimal' is set", () => {
    const middleware = createCurrentTenantMiddleware({ rewriteHeaderAs: "decimal" });
    const req = {
      headers: { "x-tenant-id": "999999" },
      user: { userUuid: "u-1", tenantId: 7n, tokenId: "jti" },
    } as unknown as Request;
    const res = buildRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(req.tenantId).toBe(7n);
    expect(req.headers["x-tenant-id"]).toBe("7");
    expect(next).toHaveBeenCalledTimes(1);
  });
});
