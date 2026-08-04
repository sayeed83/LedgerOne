import { Request, Response } from "express";
import { correlationIdMiddleware } from "./correlation-id.middleware";
import { getCorrelationId } from "../logging/correlation-context";

function buildRes() {
  return { setHeader: jest.fn() } as unknown as Response;
}

describe("correlation-id.middleware", () => {
  it("generates a correlation ID, sets it on req and the response header, and calls next()", () => {
    const req = { headers: {} } as Request;
    const res = buildRes();
    const next = jest.fn(() => {
      // Assert inside next() — correlation-context.ts's AsyncLocalStorage
      // is only bound for the duration of this call.
      expect(getCorrelationId()).toBe(req.correlationId);
    });

    correlationIdMiddleware(req, res, next);

    expect(req.correlationId).toBeDefined();
    expect(res.setHeader).toHaveBeenCalledWith("X-Correlation-Id", req.correlationId);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("propagates an upstream-supplied X-Correlation-Id instead of generating a new one", () => {
    const req = { headers: { "x-correlation-id": "upstream-id-123" } } as unknown as Request;
    const res = buildRes();
    const next = jest.fn();

    correlationIdMiddleware(req, res, next);

    expect(req.correlationId).toBe("upstream-id-123");
    expect(res.setHeader).toHaveBeenCalledWith("X-Correlation-Id", "upstream-id-123");
  });
});
