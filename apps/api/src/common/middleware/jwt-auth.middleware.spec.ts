import { Request, Response } from "express";
import { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
import { AccessTokenVerifier, createJwtAuthMiddleware } from "./jwt-auth.middleware";

function buildFakeVerifier(overrides: Partial<AccessTokenVerifier> = {}): AccessTokenVerifier {
  return {
    verifyAccessToken: jest.fn(),
    ...overrides,
  };
}

function buildRes() {
  const res = { status: jest.fn(), json: jest.fn() } as unknown as Response;
  (res.status as jest.Mock).mockReturnValue(res);
  return res;
}

describe("jwt-auth.middleware", () => {
  it("returns 401 AUTH_MISSING_TOKEN when no Authorization header is present", () => {
    const middleware = createJwtAuthMiddleware(buildFakeVerifier());
    const req = { headers: {} } as Request;
    const res = buildRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: { code: "AUTH_MISSING_TOKEN", message: expect.any(String) } });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 AUTH_MISSING_TOKEN when the Authorization header is not a Bearer token", () => {
    const middleware = createJwtAuthMiddleware(buildFakeVerifier());
    const req = { headers: { authorization: "Basic abc123" } } as Request;
    const res = buildRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: { code: "AUTH_MISSING_TOKEN", message: expect.any(String) } });
  });

  it("returns 401 AUTH_TOKEN_EXPIRED when verification throws TokenExpiredError", () => {
    const tokenVerifier = buildFakeVerifier({
      verifyAccessToken: jest.fn(() => {
        throw new TokenExpiredError("jwt expired", new Date());
      }),
    });
    const middleware = createJwtAuthMiddleware(tokenVerifier);
    const req = { headers: { authorization: "Bearer expired-token" } } as Request;
    const res = buildRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: { code: "AUTH_TOKEN_EXPIRED", message: expect.any(String) } });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 AUTH_INVALID_TOKEN when verification throws any other error", () => {
    const tokenVerifier = buildFakeVerifier({
      verifyAccessToken: jest.fn(() => {
        throw new JsonWebTokenError("invalid signature");
      }),
    });
    const middleware = createJwtAuthMiddleware(tokenVerifier);
    const req = { headers: { authorization: "Bearer tampered-token" } } as Request;
    const res = buildRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: { code: "AUTH_INVALID_TOKEN", message: expect.any(String) } });
  });

  it("populates req.user and calls next() on a valid token", () => {
    const tokenVerifier = buildFakeVerifier({
      verifyAccessToken: jest.fn(() => ({
        sub: "00000000-0000-0000-0000-000000000001",
        tenantId: "42",
        jti: "jti-123",
      })),
    });
    const middleware = createJwtAuthMiddleware(tokenVerifier);
    const req = { headers: { authorization: "Bearer valid-token" } } as Request;
    const res = buildRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(req.user).toEqual({
      userUuid: "00000000-0000-0000-0000-000000000001",
      tenantId: 42n,
      tokenId: "jti-123",
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
