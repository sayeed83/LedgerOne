// Refresh-token cookie handling (SESS-002: httpOnly, Secure, SameSite=Strict).
// Reading an incoming cookie normally goes through `cookie-parser`
// middleware; since middleware is out of scope for this task, `req.headers.cookie`
// is parsed inline here instead of adding a new middleware dependency.
// Setting a cookie needs no middleware at all — `res.cookie` is built into
// Express. CSRF double-submit checking (CSRF-002, required alongside this
// cookie on `/auth/refresh`) is not implemented here — deferred with the
// rest of this task's excluded middleware.
import { Request, Response } from "express";

export const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

export function readRefreshTokenCookie(req: Request): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex === -1) continue;
    const name = part.slice(0, separatorIndex).trim();
    if (name === REFRESH_TOKEN_COOKIE_NAME) {
      return decodeURIComponent(part.slice(separatorIndex + 1).trim());
    }
  }
  return undefined;
}

export function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { httpOnly: true, secure: true, sameSite: "strict" });
}
