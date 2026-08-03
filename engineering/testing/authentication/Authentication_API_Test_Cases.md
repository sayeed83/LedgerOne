# Authentication API — Test Cases

**Purpose:** Concrete, executable test cases for the Authentication module, organized by scenario category, for QA/integration/manual testing and Postman collection authoring.

**Pair with:** `Authentication_API_Documentation.md` (same folder) for full request/response/error-code detail per endpoint.

**Scope:** `POST /api/v1/auth/{login, mfa/verify, refresh, logout, forgot-password, reset-password}` and `GET /health`.

**Setup precondition for most cases below:** a seeded `user_credentials` row is required before any login-dependent test can run — there is no registration endpoint. See `Authentication_API_Documentation.md` § 0.4 for why, and ask engineering for the seed script if one isn't already available to you.

---

## Test Case ID Legend

`TC-<CATEGORY>-<NN>` — category abbreviations: `HAPPY`, `INVALID`, `CRED`, `LOCK`, `REFRESH-EXP`, `REFRESH-REUSE`, `RESET-INV`, `RESET-EXP`, `MFA-INV`, `MFA-EXP`, `HDR`, `TENANT`, `SQLI`, `XSS`, `LARGE`, `RATE`, `CONC`.

---

## 1. Happy Path

| ID | Endpoint | Steps | Expected Status | Expected Code / Body |
|---|---|---|---|---|
| TC-HAPPY-01 | `POST /login` | Valid `tenantId`/`email`/`password` for a non-MFA account | 200 | `data.accessToken` present (string); `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict` present |
| TC-HAPPY-02 | `POST /login` | Valid credentials for an MFA-enabled account | 200 | `data.mfaChallengeToken` present; **no** `Set-Cookie` header |
| TC-HAPPY-03 | `POST /mfa/verify` | Use `mfaChallengeToken` from TC-HAPPY-02 with the correct current TOTP code | 200 | `data.accessToken` present; `Set-Cookie: refreshToken=...` present |
| TC-HAPPY-04 | `POST /refresh` | Send the cookie captured from TC-HAPPY-01 | 200 | `data.accessToken` present, different from the original access token |
| TC-HAPPY-05 | `POST /logout` | Send the cookie captured from TC-HAPPY-01 | 204 | Empty body; `Set-Cookie: refreshToken=; Max-Age=0` (cookie cleared) |
| TC-HAPPY-06 | `POST /forgot-password` | Valid `tenantId` + an email that exists | 200 | `data.message` = `"If an account with that email exists, a password reset link has been sent."` |
| TC-HAPPY-07 | `POST /reset-password` | Use a reset token retrieved via direct repository access (see Documentation § 0.4) with a valid new password | 200 | `data.message` = `"Password has been reset successfully."` |
| TC-HAPPY-08 | `GET /health` | No setup needed, DB running | 200 | `{"status":"ok"}` |
| TC-HAPPY-09 | `POST /login` (post-reset) | Log in with the password set in TC-HAPPY-07 | 200 | `data.accessToken` present — confirms the new password actually took effect |
| TC-HAPPY-10 | `POST /refresh` (post-reset) | Use the **pre-reset** refresh token from TC-HAPPY-01 | 401 | `AUTH_INVALID_REFRESH_TOKEN` — confirms reset revoked the old session (this is a negative assertion inside a happy-path flow, intentionally) |

---

## 2. Invalid Input

| ID | Endpoint | Steps | Expected Status | Expected Code |
|---|---|---|---|---|
| TC-INVALID-01 | `POST /login` | Omit `password` | 422 | `VALIDATION_ERROR` |
| TC-INVALID-02 | `POST /login` | `email: "not-an-email"` | 422 | `VALIDATION_ERROR` |
| TC-INVALID-03 | `POST /login` | `tenantId: "abc"` | 422 | `VALIDATION_ERROR` |
| TC-INVALID-04 | `POST /login` | `tenantId: 1` (JSON number, not string) | 422 | `VALIDATION_ERROR` (schema requires a string) |
| TC-INVALID-05 | `POST /login` | Empty body `{}` | 422 | `VALIDATION_ERROR`, `details` lists all 3 missing fields |
| TC-INVALID-06 | `POST /mfa/verify` | `totpCode: "12345"` (5 digits) | 422 | `VALIDATION_ERROR` |
| TC-INVALID-07 | `POST /mfa/verify` | `totpCode: "1234567"` (7 digits) | 422 | `VALIDATION_ERROR` |
| TC-INVALID-08 | `POST /mfa/verify` | `totpCode: "12a456"` (non-digit) | 422 | `VALIDATION_ERROR` |
| TC-INVALID-09 | `POST /forgot-password` | Omit `email` | 422 | `VALIDATION_ERROR` |
| TC-INVALID-10 | `POST /reset-password` | Omit `token` | 422 | `VALIDATION_ERROR` |
| TC-INVALID-11 | `POST /reset-password` | Omit `newPassword` | 422 | `VALIDATION_ERROR` |
| TC-INVALID-12 | Any JSON endpoint | Send malformed JSON body (e.g. trailing comma, unterminated string) | 400/422 | Express's JSON body-parser itself rejects malformed JSON before the route handler runs — expect a body-parser error, not `VALIDATION_ERROR` (verify actual status; this bypasses this module's own validation entirely) |

---

## 3. Invalid Credentials

| ID | Endpoint | Steps | Expected Status | Expected Code |
|---|---|---|---|---|
| TC-CRED-01 | `POST /login` | Correct email, wrong password | 401 | `AUTH_INVALID_CREDENTIALS` |
| TC-CRED-02 | `POST /login` | Email that does not exist at all | 401 | `AUTH_INVALID_CREDENTIALS` — **assert response is byte-identical to TC-CRED-01's** (status, body, `Content-Type`) per AUTHN-005 |
| TC-CRED-03 | `POST /mfa/verify` | Correct challenge token, wrong 6-digit code | 401 | `AUTH_INVALID_CREDENTIALS` |
| TC-CRED-04 | `POST /login` | Password with correct value but different case (passwords are case-sensitive) | 401 | `AUTH_INVALID_CREDENTIALS` |
| TC-CRED-05 | `POST /login` | Correct password, but for a *different* `tenantId` than the account belongs to | 401 | `AUTH_INVALID_CREDENTIALS` (identical to "account doesn't exist" — tenant scoping is a straight filter) |

---

## 4. Locked Account

| ID | Endpoint | Steps | Expected Status | Expected Code |
|---|---|---|---|---|
| TC-LOCK-01 | `POST /login` ×10 | 10 consecutive wrong-password attempts against the same account | 10th response: 401 (`AUTH_INVALID_CREDENTIALS`, the increment itself doesn't change the response of the triggering attempt) | — |
| TC-LOCK-02 | `POST /login` (11th) | Immediately retry with the **correct** password | 403 | `AUTH_ACCOUNT_LOCKED` — proves the lock blocks even a correct password |
| TC-LOCK-03 | `POST /login` | Wait 15+ minutes after TC-LOCK-02, retry with correct password | 200 | Lock naturally expires; login succeeds |
| TC-LOCK-04 | `POST /mfa/verify` ×10 | 10 consecutive wrong-TOTP-code attempts (fresh account, no prior password failures) | 10th: 401 `AUTH_INVALID_CREDENTIALS`; subsequent attempt: 403 `AUTH_ACCOUNT_LOCKED` | Confirms MFA failures share the same counter as password failures |
| TC-LOCK-05 | `POST /login` (mixed) | 5 wrong passwords, then 5 wrong TOTP codes via `/mfa/verify` on the same account | 11th attempt (any kind) | 403 `AUTH_ACCOUNT_LOCKED` — confirms the counters are shared, not independent per-endpoint |
| TC-LOCK-06 | `POST /login` | While locked, submit a request with a completely different (also wrong) password | 403 | `AUTH_ACCOUNT_LOCKED` (not `AUTH_INVALID_CREDENTIALS` — the lock check happens before password verification) |

---

## 5. Expired Refresh Token

| ID | Endpoint | Steps | Expected Status | Expected Code |
|---|---|---|---|---|
| TC-REFRESH-EXP-01 | `POST /refresh` | Use a refresh token whose JWT `exp` has passed (issue one with an artificially short TTL in a test fixture, or wait 7+ days in a long-lived environment) | 401 | `AUTH_INVALID_REFRESH_TOKEN` |
| TC-REFRESH-EXP-02 | `POST /refresh` | Use a refresh token that is cryptographically unexpired but whose DB row's `expiresAt` has been manually set to the past (integration-test-only scenario, via direct repository access) | 401 | `AUTH_INVALID_REFRESH_TOKEN` — confirms the DB-side check is independently enforced, not just the JWT's own `exp` |
| TC-REFRESH-EXP-03 | `POST /logout` | Same setup as TC-REFRESH-EXP-01 | 401 | `AUTH_INVALID_REFRESH_TOKEN` (logout has the identical expiry check) |

---

## 6. Reused Refresh Token

Read this section together with Documentation § 0.4 — **this system does not rotate refresh tokens**, so "reuse" only becomes invalid after explicit revocation, not automatically.

| ID | Endpoint | Steps | Expected Status | Expected Code |
|---|---|---|---|---|
| TC-REFRESH-REUSE-01 | `POST /refresh` | Call twice in a row with the same still-valid token | Both calls: 200 | This is **expected, correct behavior** — do not file as a bug |
| TC-REFRESH-REUSE-02 | `POST /refresh` (after logout) | Log out (revokes the token), then call `/refresh` with the same token | 401 | `AUTH_INVALID_REFRESH_TOKEN` |
| TC-REFRESH-REUSE-03 | `POST /refresh` (after password reset) | Reset the account's password (revokes all sessions), then call `/refresh` with a token issued before the reset | 401 | `AUTH_INVALID_REFRESH_TOKEN` |
| TC-REFRESH-REUSE-04 | `POST /logout` ×2 | Log out twice in a row with the same token | 1st: 204; 2nd: **204** (idempotent no-op, not an error — see Documentation § 4) | Confirm this explicitly — it's a common false-positive bug report |

---

## 7. Invalid Reset Token

| ID | Endpoint | Steps | Expected Status | Expected Code |
|---|---|---|---|---|
| TC-RESET-INV-01 | `POST /reset-password` | Random 64-char hex string that was never issued | 422 | `AUTH_INVALID_RESET_TOKEN` |
| TC-RESET-INV-02 | `POST /reset-password` | A token that was already successfully used once | 422 | `AUTH_INVALID_RESET_TOKEN` |
| TC-RESET-INV-03 | `POST /reset-password` | A valid token, but the `tenantId` field points to a different tenant than the one the token was issued under | 422 | `AUTH_INVALID_RESET_TOKEN` (tenant-scoped lookup finds nothing) |
| TC-RESET-INV-04 | `POST /reset-password` | Empty-string `token` | 422 | `VALIDATION_ERROR` (fails schema before reaching token lookup — distinct from the above) |

---

## 8. Expired Reset Token

| ID | Endpoint | Steps | Expected Status | Expected Code |
|---|---|---|---|---|
| TC-RESET-EXP-01 | `POST /reset-password` | Use a token more than 15 minutes after `/forgot-password` issued it | 422 | `AUTH_INVALID_RESET_TOKEN` |
| TC-RESET-EXP-02 | `POST /reset-password` | Use a token at exactly the boundary (e.g. 14 min 59 sec) | 200 | Should still succeed — boundary test; if flaky, note clock-skew tolerance (none currently implemented) |
| TC-RESET-EXP-03 | `POST /reset-password` | Use a token at 15 min 1 sec | 422 | `AUTH_INVALID_RESET_TOKEN` |

---

## 9. Invalid MFA Code

(See also § 3 Invalid Credentials, TC-CRED-03, which overlaps.)

| ID | Endpoint | Steps | Expected Status | Expected Code |
|---|---|---|---|---|
| TC-MFA-INV-01 | `POST /mfa/verify` | Correct challenge token, all-zeros code `"000000"` (almost certainly wrong) | 401 | `AUTH_INVALID_CREDENTIALS` |
| TC-MFA-INV-02 | `POST /mfa/verify` | Correct challenge token, code from a **different** account's TOTP secret | 401 | `AUTH_INVALID_CREDENTIALS` |
| TC-MFA-INV-03 | `POST /mfa/verify` | Correct challenge token, code generated 2+ time-steps (60+ seconds) in the past/future | 401 | `AUTH_INVALID_CREDENTIALS` — Speakeasy's default verification window is narrow; confirm actual tolerance empirically since no LedgerOne-specific window is documented |
| TC-MFA-INV-04 | `POST /mfa/verify` | Structurally valid challenge token, but for a credential that has since had MFA disabled (would need direct DB manipulation to construct, since no disable-MFA endpoint exists) | 409 | `AUTH_MFA_NOT_ENABLED` |

---

## 10. Expired MFA Challenge

| ID | Endpoint | Steps | Expected Status | Expected Code |
|---|---|---|---|---|
| TC-MFA-EXP-01 | `POST /mfa/verify` | Use an `mfaChallengeToken` more than 5 minutes after `/login` issued it, with a currently-correct TOTP code | 401 | `AUTH_MFA_CHALLENGE_INVALID` (not `AUTH_INVALID_CREDENTIALS` — the token itself fails before the code is even checked) |
| TC-MFA-EXP-02 | `POST /mfa/verify` | Challenge token at the 4:59 boundary | 200 (assuming correct code) | Boundary test |
| TC-MFA-EXP-03 | `POST /mfa/verify` | Challenge token at the 5:01 boundary | 401 | `AUTH_MFA_CHALLENGE_INVALID` |

---

## 11. Missing Headers

| ID | Endpoint | Steps | Expected Status | Expected Code |
|---|---|---|---|---|
| TC-HDR-01 | `POST /login` | Valid JSON body, but omit `Content-Type: application/json` entirely | 422 | `VALIDATION_ERROR` — body arrives unparsed (empty), all fields report as missing |
| TC-HDR-02 | `POST /login` | Send `Content-Type: text/plain` with a JSON-shaped string body | 422 | `VALIDATION_ERROR` (same reason as above) |
| TC-HDR-03 | `POST /refresh` | Omit the `Cookie` header entirely | 401 | `AUTH_INVALID_REFRESH_TOKEN` |
| TC-HDR-04 | `POST /logout` | Omit the `Cookie` header entirely | 401 | `AUTH_INVALID_REFRESH_TOKEN` |
| TC-HDR-05 | `POST /logout` | Include a valid `Authorization: Bearer <accessToken>` header but **no** cookie | 401 | `AUTH_INVALID_REFRESH_TOKEN` — confirms the (spec-documented but unimplemented) Bearer requirement has no actual effect currently; the cookie is the only thing checked |
| TC-HDR-06 | `POST /login` | Send an oversized/malformed `Cookie` header (irrelevant to this endpoint) alongside a valid body | 200 | Confirms unrelated headers don't interfere |

---

## 12. Invalid Tenant

There is no dedicated "tenant not found" error — see Documentation § 0.4/§1. These cases confirm that behavior explicitly rather than assuming it.

| ID | Endpoint | Steps | Expected Status | Expected Code |
|---|---|---|---|---|
| TC-TENANT-01 | `POST /login` | `tenantId` that is numeric but corresponds to no real tenant (e.g. `"999999999"`), valid-looking email/password | 401 | `AUTH_INVALID_CREDENTIALS` — identical to "email doesn't exist," since tenant existence is never separately checked |
| TC-TENANT-02 | `POST /login` | `tenantId: "0"` | 401 (assuming no credential exists for tenant 0) | `AUTH_INVALID_CREDENTIALS` — confirm `0` is accepted as a syntactically valid numeric string (the regex `^\d+$` permits it) |
| TC-TENANT-03 | `POST /login` | `tenantId` as a huge number exceeding safe integer range, e.g. `"99999999999999999999999999"` | 200/401 (not a validation error) | Confirms the schema's `BigInt()` transform handles arbitrarily large numeric strings without overflow (unlike a plain JS `number`) |
| TC-TENANT-04 | `POST /login` | Negative tenant ID, e.g. `"-1"` | 422 | `VALIDATION_ERROR` — the regex `^\d+$` rejects a leading `-` |
| TC-TENANT-05 | `POST /login` | `tenantId: "01"` (leading zero) | Depends on `BigInt("01")` behavior — verify empirically; expect this to be accepted and treated as tenant `1` | Document actual observed behavior here after running |

---

## 13. SQL Injection Attempts

All queries in this module go through Prisma's parameterized query builder — no raw string-concatenated SQL exists anywhere in the Authentication module. These tests exist to *confirm* that structural protection, not because a vulnerability is expected.

| ID | Endpoint | Payload | Expected Result |
|---|---|---|---|
| TC-SQLI-01 | `POST /login` | `email: "' OR '1'='1"` | 422 `VALIDATION_ERROR` (fails email format before reaching any query) |
| TC-SQLI-02 | `POST /login` | `email: "a@example.com' OR '1'='1"` (still fails `.email()`) | 422 `VALIDATION_ERROR` |
| TC-SQLI-03 | `POST /login` | `password: "' OR '1'='1"` | 401 `AUTH_INVALID_CREDENTIALS` (password has no format restriction, so this reaches Argon2 verification and simply fails as a wrong password — must **not** authenticate) |
| TC-SQLI-04 | `POST /reset-password` | `token: "'; DROP TABLE password_reset_tokens; --"` | 422 `AUTH_INVALID_RESET_TOKEN` (treated as a literal, non-matching lookup value; confirm the table still exists afterward) |
| TC-SQLI-05 | `POST /forgot-password` | `email: "x@example.com'; --"` | 422 `VALIDATION_ERROR` (fails email format) |
| TC-SQLI-06 | `POST /login` | `tenantId: "1 OR 1=1"` | 422 `VALIDATION_ERROR` (fails the digits-only regex) |

**Pass criterion for the whole section:** no payload ever authenticates, alters unintended data, or produces a database error visible in the response. If any payload returns `500 INTERNAL_ERROR`, treat that as a P1 finding regardless of whether the payload also "failed" — it indicates the input reached the database in a way that broke the query.

---

## 14. XSS Payloads

This is a JSON API — no HTML is rendered by any Authentication endpoint, so classic reflected/stored XSS via the HTTP response body is structurally unlikely here. These tests confirm that assumption and check for unsafe echoing.

| ID | Endpoint | Payload | Expected Result |
|---|---|---|---|
| TC-XSS-01 | `POST /login` | `email: "<script>alert(1)</script>@example.com"` | 422 `VALIDATION_ERROR` (fails `.email()` format) |
| TC-XSS-02 | `POST /login` | `password: "<script>alert(1)</script>"` | 401 `AUTH_INVALID_CREDENTIALS` (no format restriction on password — passes through to Argon2 verify as a literal string; confirm it is never reflected anywhere in the response and never interpreted) |
| TC-XSS-03 | `POST /forgot-password` | `email: "\"><img src=x onerror=alert(1)>@example.com"` | 422 `VALIDATION_ERROR` |
| TC-XSS-04 | `POST /reset-password` | `newPassword: "<img src=x onerror=alert(1)>a-otherwise-valid-length"` | 200 if ≥12 chars and token valid — the value is hashed, never rendered; confirm the raw payload never appears in any response body |
| TC-XSS-05 | Any endpoint | Payload in a header value (e.g. custom `User-Agent: <script>alert(1)</script>`) | Should not affect the response; `userAgent` is only ever stored in `login_attempts` for audit purposes, never rendered back in an HTTP response by this module |

**Pass criterion:** no payload is ever reflected unescaped in any response body, and no payload alters control flow (e.g. bypasses validation it should have failed).

---

## 15. Large Payload Tests

| ID | Endpoint | Payload | Expected Result |
|---|---|---|---|
| TC-LARGE-01 | `POST /login` | `password` field of ~1MB of random characters | Express's default `express.json()` body-size limit (100kb) should reject this **before** the route handler runs — expect a `413 Payload Too Large` (or body-parser's own error response), not `VALIDATION_ERROR` — verify the actual behavior and record it here |
| TC-LARGE-02 | `POST /login` | Total JSON body just under 100kb (e.g. a ~90kb `password` value) | Should pass the body-size limit and reach validation; `password` has no max-length check at the schema level for `/login`, so expect it to reach Argon2 `verify()` — confirm this doesn't cause excessive latency (Argon2 cost is independent of input length in practice, but confirm) |
| TC-LARGE-03 | `POST /reset-password` | `newPassword` of 10,000 characters | 422 `AUTH_PASSWORD_POLICY_VIOLATION` (>128 char policy check) — confirm this is rejected **before** Argon2 hashing occurs (cheap rejection, not an expensive hash of a huge string) |
| TC-LARGE-04 | `POST /mfa/verify` | `mfaChallengeToken` of ~1MB (garbage, not a real JWT) | Should fail JWT parsing quickly → 401 `AUTH_MFA_CHALLENGE_INVALID`; confirm no excessive CPU/memory spent attempting to parse it |
| TC-LARGE-05 | Any endpoint | Thousands of extra, unexpected JSON fields alongside valid ones | Zod schemas here use `z.object()` without `.strict()` — extra fields are silently stripped, not rejected; confirm this explicitly (a large number of extra fields should not cause an error, just be ignored) |

---

## 16. Rate Limit Tests

**Read this first:** no rate limiting is implemented anywhere in this module (see Documentation § 0.4). The tests below exist to characterize *actual current behavior*, not to validate a rate-limiting feature that doesn't exist yet — do not fail these as "bugs" against this milestone; instead, use them as a baseline for when rate limiting (RATE-002) is eventually built.

| ID | Endpoint | Steps | Expected Current Behavior |
|---|---|---|---|
| TC-RATE-01 | `POST /login` | 100 rapid-fire requests from the same IP against a nonexistent account, within 1 second | All 100 are processed individually; none are throttled; the only thing that will eventually change behavior is the target account's own lockout counter *if* a real, existing account is targeted instead |
| TC-RATE-02 | `POST /login` | 20 rapid requests against the same real account with wrong passwords | 10th request onward → `AUTH_ACCOUNT_LOCKED` (this is the lockout mechanism, not rate limiting — document the distinction clearly in results) |
| TC-RATE-03 | `POST /forgot-password` | 50 rapid requests for the same email | All 50 succeed individually (200, generic message) — each creates its own reset-token row; no throttling, no error |
| TC-RATE-04 | `POST /mfa/verify` | 50 rapid requests with random 6-digit codes against a live challenge token | Codes fail individually until the 10-attempt lockout triggers; no per-request throttling exists independent of that counter |
| TC-RATE-05 | `GET /health` | 1,000 rapid requests | All processed; no rate limiting (this is intentional per HC-001 — health checks must never be rate-limited) |

**Recommendation for the record:** once RATE-002 is implemented, re-run TC-RATE-01 through TC-RATE-04 and update expected results to reflect actual throttling (expect `429` with a `RATE_LIMITED`-style code once that exists).

---

## 17. Concurrent Login Tests

| ID | Endpoint | Steps | Expected Result |
|---|---|---|---|
| TC-CONC-01 | `POST /login` | Fire 20 concurrent requests with the **correct** password for the same account simultaneously | All 20 should succeed (200) with 20 distinct access/refresh token pairs; each creates its own `refresh_tokens` row |
| TC-CONC-02 | `POST /login` | Fire 20 concurrent requests with the **wrong** password for the same account simultaneously | All 20 should fail (401); afterward, confirm `failedLoginCount` increased by **exactly 20** (Prisma's atomic `increment` operator should prevent lost updates under concurrency) — this is the key correctness assertion, not just "did they all fail" |
| TC-CONC-03 | `POST /login` | Fire enough concurrent wrong-password requests to cross the lockout threshold exactly at the boundary (e.g. account starts at 8 failed attempts, fire 5 concurrent wrong attempts) | Confirm the account ends up locked (not under-locked due to a race where multiple requests read the same pre-increment count) — this specifically probes the check-then-act sequence around the lockout threshold, which is **not** wrapped in a serializable transaction in the current implementation; a race here (allowing more than 10 failures to be counted before the lock takes effect, or the lock applying a request or two late) is a plausible, low-severity finding worth documenting rather than assuming away |
| TC-CONC-04 | `POST /refresh` | Fire 10 concurrent refresh requests using the same still-valid refresh token | All 10 should succeed (200) — no rotation means no exclusivity is expected here; this is normal |
| TC-CONC-05 | `POST /logout` | Fire 2 concurrent logout requests using the same token | Both should return 204 (idempotent design tolerates this) — confirm no error/race condition surfaces (e.g. no unhandled exception from a double-revoke `UPDATE`) |
| TC-CONC-06 | `POST /reset-password` | Fire 2 concurrent reset-password requests using the **same** reset token | Exactly one should succeed (200); the other should get `AUTH_INVALID_RESET_TOKEN` (422) — confirms the "mark used" check-then-act isn't itself racy enough to let the same token reset the password twice. This is worth close attention: the current implementation reads the token, then separately updates the password and marks it used as two distinct calls, not inside one atomic transaction — a genuine race window may exist here and this test may reveal it. Treat a failure of this test (both requests succeeding) as a real finding to report, not an expected outcome. |

---

*End of document. Test case IDs are stable references — link them from bug reports and Postman test scripts. Update this file whenever the module's behavior changes (rate limiting, CSRF, MFA enrollment, session management, or refresh-token rotation being added will each invalidate specific rows above).*
