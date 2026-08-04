import { Request, Response } from "express";
import { errorHandlerMiddleware } from "./error-handler.middleware";

function buildRes() {
  const res = { status: jest.fn(), json: jest.fn() } as unknown as Response;
  (res.status as jest.Mock).mockReturnValue(res);
  return res;
}

describe("error-handler.middleware", () => {
  it("responds 500 INTERNAL_ERROR with a generic message, never the raw error", () => {
    const req = { correlationId: "corr-1" } as Request;
    const res = buildRes();
    const next = jest.fn();

    errorHandlerMiddleware(new Error("some sensitive internal detail"), req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." },
    });
  });
});
