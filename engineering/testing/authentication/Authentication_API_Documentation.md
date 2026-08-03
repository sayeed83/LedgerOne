# Authentication API — Documentation

**Purpose:** Complete API contract reference for the Authentication module, for use by Postman collection authors, QA, integration testing, and manual testing.

**Status:** Reflects the Authentication module exactly as implemented and integrated as of this document's writing (`apps/api/src/shared/authentication/`, mounted at `/api/v1/auth` via `apps/api/src/module-registry.ts`; `GET /health` at `apps/api/src/server.ts`). This is a documentation artifact only — no application code was changed to produce it.

**Base URL (local dev):** `http://localhost:4000`

**Related documents:** `00_BUSINESS_RULES.md`, `03_ARCHITECTURE.md`, `07_REST_API_STANDARDS.md`, `09_SECURITY_GUIDELINES.md`, `engineering/prompts/02_platform/00_auth.md` (Authentication Module Specification), `10_DEPLOYMENT_ARCHITECTURE.md` (health-check standard).

---

## 0. Conventions Used Throughout This Document

### 0.1 Response Envelope

Every success response is wrapped as:

```json
{ "data": { /* endpoint-specific payload */ } }
```

Every error response is wrapped as:

```json
{ "error": { "code": "STABLE_MACHINE_READABLE_CODE", "message": "Human-readable message.", "details": [ /* optional, Zod validation issues only */ ] } }
```

`GET /health` is the one deliberate exception — it returns a bare `{ "status": "ok" }` / `{ "status": "error" }`, per `10_DEPLOYMENT_ARCHITECTURE.md` HC-004.

### 0.2 `tenantId` — read this before testing anything

There is no Organization/tenant-resolution module yet. For the three "first contact" endpoints — **login, forgot-password, reset-password** — `tenantId` must be supplied **directly in the request body** as a decimal numeric string (e.g. `"1"`). This is an explicitly flagged interim gap, not a designed permanent contract: once tenant resolution exists, this will change and this document will need updating.

For **refresh, logout, and mfa/verify**, `tenantId` is **not** a request field — it is derived from the token you already hold (the refresh-token cookie, or the `mfaChallengeToken`). Do not send a `tenantId` field on these three; it will simply be ignored.

### 0.3 Error Code Reference Table

| Code | HTTP Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Request body failed Zod schema validation. |
| `AUTH_INVALID_CREDENTIALS` | 401 | Wrong password, or the email/tenant combination does not exist. Deliberately identical for both cases. |
| `AUTH_ACCOUNT_LOCKED` | 403 | Account is locked from repeated failed attempts (password or MFA). |
| `AUTH_MFA_CHALLENGE_INVALID` | 401 | `mfaChallengeToken` is malformed, expired, or its signature doesn't verify. |
| `AUTH_MFA_NOT_ENABLED` | 409 | The credential behind a (structurally valid) challenge token doesn't actually have MFA enabled. |
| `AUTH_INVALID_REFRESH_TOKEN` | 401 | Missing cookie, malformed/expired JWT, or a JWT that's cryptographically valid but revoked/expired in the database. |
| `AUTH_INVALID_RESET_TOKEN` | 422 | Reset token not found, already used, or expired — all three collapse to this one code/message (deliberately, to avoid leaking which). |
| `AUTH_PASSWORD_POLICY_VIOLATION` | 422 | New password is shorter than 12 or longer than 128 characters. |
| `AUTH_DOMAIN_ERROR` | 422 | Generic fallback — should not occur given the current error set; present for forward-compatibility. |
| `INTERNAL_ERROR` | 500 | Unexpected/unhandled error (bug, DB outage mid-request, etc.). |

### 0.4 Known Gaps — read before filing bugs

These are real, current limitations of the implementation, not defects introduced by testing:

- **No rate limiting is implemented.** RATE-002 (5 attempts/15 min per account+IP) does not exist yet — nothing but the 10-attempt account lockout (§ below) will stop rapid repeated requests.
- **No CSRF double-submit check on `/refresh`.** The refresh cookie's `SameSite=Strict` is the only protection currently in place.
- **`AUTH_ACCOUNT_LOCKED` does not tell the caller when the lock lifts.** The lock duration (15 minutes) is enforced server-side, but the response body has no `lockedUntil`/`retryAfter` field.
- **Refresh tokens are not rotated.** Calling `/refresh` repeatedly with the same still-valid refresh token is expected, supported behavior — it does not invalidate the token or issue a new one to replace it.
- **`/auth/logout` does not actually check a Bearer access token**, despite the module specification marking it Bearer-authenticated. Only the refresh-token cookie is checked. This is a documented gap (no JWT-auth middleware exists yet).
- **No endpoints exist yet** for: session listing/revocation (`GET /auth/sessions`, `DELETE /auth/sessions/{id}`) or MFA enrollment/confirm/disable (`POST /auth/mfa/enroll|confirm|disable`). Do not test for them — they will 404.
- **Forgot-password never actually sends an email.** No SES integration exists; the reset token is generated and stored, but nothing delivers it anywhere. There is no way to complete a real end-to-end reset flow through the API alone (see § 6, Manual Testing Workaround).
- **No account-creation/registration endpoint exists.** A `user_credentials` row must be seeded directly (script, or a future endpoint) before `/login` can ever succeed.

---

## 1. `POST /api/v1/auth/login`

### Description
Verifies an email/password pair. Returns an access token (and sets the refresh-token cookie) directly if MFA is not enabled on the account, or an `mfaChallengeToken` if it is.

### Authentication Required
No (unauthenticated / allow-listed).

### Headers

| Header | Required | Notes |
|---|---|---|
| `Content-Type` | Yes | Must be `application/json`, or the body will not be parsed and every field will fail as "required". |

### Query Parameters
None.

### Path Parameters
None.

### Request Body

```json
{
  "tenantId": "1",
  "email": "user@example.com",
  "password": "a-strong-password"
}
```

### Validation Rules

| Field | Rule |
|---|---|
| `tenantId` | Required. String matching `^\d+$` (digits only). Not a business-rule check — purely wire-shape. |
| `email` | Required. Must be a syntactically valid email (Zod's `.email()`). |
| `password` | Required. Any non-empty string — no length/composition check at this endpoint (that only applies to *setting* a password, in `/reset-password`). |

### Success Response

**MFA disabled** — `200 OK`:
```json
{ "data": { "accessToken": "eyJhbGciOiJSUzI1NiIs..." } }
```
Also sets: `Set-Cookie: refreshToken=<jwt>; HttpOnly; Secure; SameSite=Strict`

**MFA enabled** — `200 OK`, no cookie set:
```json
{ "data": { "mfaChallengeToken": "eyJhbGciOiJSUzI1NiIs..." } }
```

### Error Responses

| Status | Code | Condition |
|---|---|---|
| 422 | `VALIDATION_ERROR` | Malformed body (bad email format, missing field, non-numeric `tenantId`). |
| 401 | `AUTH_INVALID_CREDENTIALS` | No such (tenantId, email), or wrong password. Identical in both cases (AUTHN-005). |
| 403 | `AUTH_ACCOUNT_LOCKED` | Account has ≥10 recent failed attempts and is within its 15-minute lockout window. |
| 500 | `INTERNAL_ERROR` | Unexpected failure. |

### Status Codes
`200`, `401`, `403`, `422`, `500`.

### Example Request
```bash
curl -i -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"1","email":"test@example.com","password":"a-strong-test-password"}'
```

### Example Responses
Success:
```json
{ "data": { "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." } }
```
Invalid credentials:
```json
{ "error": { "code": "AUTH_INVALID_CREDENTIALS", "message": "Invalid email or password." } }
```

### Business Rules
- Every attempt (success or failure) is recorded via `recordLoginAttempt`, linked to the credential when one was found, or `null` when the email didn't match anything (so brute-force detection can still see the attempt without confirming account existence).
- A successful login resets `failedLoginCount` to 0.
- A failed login increments `failedLoginCount`; on reaching 10, the account is locked for 15 minutes from that moment.
- Access token: RS256 JWT, 15-minute expiry, claims `{sub: userUuid, tenantId, plane: "tenant", jti}`.
- Refresh token: RS256 JWT, 7-day expiry, same claim shape; its `jti` is also persisted server-side (`refresh_tokens` table) so it can be individually revoked later.
- The refresh token is **never** present in the JSON body — only in the `Set-Cookie` header (SESS-001/SESS-002).

### Edge Cases
- Email exists in a *different* tenant than the one supplied → behaves exactly like "email doesn't exist" (401 `AUTH_INVALID_CREDENTIALS`) — tenant scoping is a straight equality filter, not a partial match.
- Password correct but account already locked → `AUTH_ACCOUNT_LOCKED`, the correct password is never even checked (lock is evaluated first).
- Trailing/leading whitespace in `email` is not trimmed by the schema — `" user@example.com"` may fail `.email()` or silently fail to match a stored row (untrimmed) — worth an explicit test.

### Negative Test Cases
1. Missing `password` field → 422 `VALIDATION_ERROR`.
2. `tenantId: "abc"` (non-numeric) → 422 `VALIDATION_ERROR`.
3. `email: "not-an-email"` → 422 `VALIDATION_ERROR`.
4. Correct email, wrong password → 401 `AUTH_INVALID_CREDENTIALS`.
5. Nonexistent email entirely → 401 `AUTH_INVALID_CREDENTIALS` (same code/message/shape as #4 — assert byte-for-byte equality of both responses as a regression test for AUTHN-005).
6. 11th consecutive wrong password → 403 `AUTH_ACCOUNT_LOCKED` (even if the 11th attempt uses the *correct* password).
7. Empty JSON body `{}` → 422 `VALIDATION_ERROR` listing all three fields as missing.
8. No `Content-Type` header at all → body arrives unparsed → 422 `VALIDATION_ERROR`.

### Security Test Cases
- SQL injection in `email`: e.g. `"' OR '1'='1"` — must fail email-format validation (422) before ever reaching a query; if it somehow passed validation, Prisma's parameterized queries prevent injection regardless (no raw SQL is used anywhere in this module).
- SQL injection in `password`: any string is accepted as a candidate password (no format restriction) — confirm it is only ever used inside `argon2.verify()`, never interpolated into a query.
- XSS payload in `email`, e.g. `<script>alert(1)</script>@example.com` — should fail `.email()` format validation (422); if a technically-valid-looking address contains script-like characters, confirm the API does not reflect it unescaped anywhere in the response (it currently doesn't — the endpoint never echoes the submitted email back).
- Timing: compare response latency for "unknown email" vs. "wrong password" — should be close (both hit the same Argon2 verify path or an early return before it); a large gap would be a timing side-channel worth flagging, though not currently mitigated with a dummy-hash comparison for the unknown-email path (verify: unknown email currently returns *before* any Argon2 call at all — this is a measurable timing difference from the wrong-password path, worth a security note even though AUTHN-005 is about response *content*, not timing, and the spec's own acceptance criteria for timing-indistinguishability may not be fully met here).
- Large payload: a multi-megabyte `password` string — confirm the server doesn't hang or crash (no explicit body-size limit is configured beyond Express's `express.json()` default of 100kb, which will itself reject oversized bodies with a 413 from body-parser before reaching the controller).

### Performance Considerations
- Argon2id verification is deliberately slow (memory cost ≥19 MiB, ≥2 iterations) — expect logins to take measurably longer (tens of milliseconds) than a simple DB lookup; this is intentional, not a bug.
- No caching of credential lookups — every login is a fresh DB read.
- No rate limiting means a load test can drive unlimited concurrent login attempts against the same account; 10 failures will lock it mid-test, which will skew throughput numbers if not accounted for.

---

## 2. `POST /api/v1/auth/mfa/verify`

### Description
Completes a login that was paused for MFA — verifies a 6-digit TOTP code against the challenge issued by `/login`, then issues the same success payload `/login` would have.

### Authentication Required
No (unauthenticated; requires possession of a valid, unexpired `mfaChallengeToken` instead).

### Headers

| Header | Required | Notes |
|---|---|---|
| `Content-Type` | Yes | `application/json`. |

### Query Parameters
None.

### Path Parameters
None.

### Request Body
```json
{
  "mfaChallengeToken": "eyJhbGciOiJSUzI1NiIs...",
  "totpCode": "123456"
}
```

### Validation Rules

| Field | Rule |
|---|---|
| `mfaChallengeToken` | Required, non-empty string. |
| `totpCode` | Required. Must match `^\d{6}$` exactly — 6 digits, no more, no less, no spaces. |

Note: `tenantId` is **not** a body field here — it's read from the challenge token itself.

### Success Response
`200 OK`:
```json
{ "data": { "accessToken": "eyJhbGciOiJSUzI1NiIs..." } }
```
Also sets the `refreshToken` cookie, identically to `/login`.

### Error Responses

| Status | Code | Condition |
|---|---|---|
| 422 | `VALIDATION_ERROR` | `totpCode` isn't 6 digits, or `mfaChallengeToken` missing. |
| 401 | `AUTH_MFA_CHALLENGE_INVALID` | Token malformed, wrong signature, or expired (5-minute TTL from issuance). |
| 401 | `AUTH_MFA_CHALLENGE_INVALID` | Token's `credentialUuid` no longer resolves to a credential (e.g. deleted in between). |
| 409 | `AUTH_MFA_NOT_ENABLED` | Structurally valid token, but the credential doesn't have MFA enabled (should not normally happen since only MFA-enabled logins issue this token). |
| 401 | `AUTH_INVALID_CREDENTIALS` | TOTP code is well-formed but wrong. |
| 403 | `AUTH_ACCOUNT_LOCKED` | Enough wrong TOTP codes (combined with any prior password failures) reached the same 10-attempt lockout threshold as `/login`. |

### Status Codes
`200`, `401`, `403`, `409`, `422`.

### Example Request
```bash
curl -i -X POST http://localhost:4000/api/v1/auth/mfa/verify \
  -H "Content-Type: application/json" \
  -d '{"mfaChallengeToken":"<token from /login>","totpCode":"123456"}'
```

### Example Responses
Wrong code:
```json
{ "error": { "code": "AUTH_INVALID_CREDENTIALS", "message": "Invalid email or password." } }
```
(Note the message text is reused verbatim from the credentials-failure path — the wrong-TOTP-code case shares the same `InvalidCredentialsError` class/message as a wrong password.)

### Business Rules
- A wrong TOTP code increments the **same** `failedLoginCount` counter as a wrong password — MFA and password failures share one lockout budget, not separate ones.
- A correct TOTP code resets `failedLoginCount` to 0, exactly like a successful password login.
- The challenge token is a self-contained JWT (5-minute TTL); there is no server-side single-use enforcement of it — a still-unexpired challenge token can be reused for multiple `/mfa/verify` attempts (e.g. retrying a mistyped code) until it expires or the account locks from too many wrong codes.

### Edge Cases
- Submitting a *correct* TOTP code but doing so after the challenge token's 5-minute TTL has elapsed → `AUTH_MFA_CHALLENGE_INVALID`, not `AUTH_INVALID_CREDENTIALS` — the code's correctness is never evaluated once the token itself fails verification.
- Reusing a challenge token from a *different, prior* login attempt after a new one was issued → both remain independently valid until each expires (no invalidation of "older" challenge tokens when a new login is started).
- A `totpCode` with leading zeros (e.g. `"000123"`) must be sent as a string, not a number — as JSON, `000123` isn't valid syntax as a bare number and must be quoted.

### Negative Test Cases
1. `totpCode: "12345"` (5 digits) → 422 `VALIDATION_ERROR`.
2. `totpCode: "abcdef"` → 422 `VALIDATION_ERROR`.
3. Well-formed but wrong `mfaChallengeToken` (e.g. a JWT signed with a different key) → 401 `AUTH_MFA_CHALLENGE_INVALID`.
4. Expired challenge token (wait >5 minutes, or use a pre-expired fixture) → 401 `AUTH_MFA_CHALLENGE_INVALID`.
5. Correct challenge token, wrong 6-digit code → 401 `AUTH_INVALID_CREDENTIALS`.
6. Repeating wrong codes until the 10th attempt → 403 `AUTH_ACCOUNT_LOCKED`.
7. An access token or refresh token passed in place of `mfaChallengeToken` → 401 `AUTH_MFA_CHALLENGE_INVALID` (wrong signing key / claim shape).

### Security Test Cases
- Attempt to pass another user's/tenant's `mfaChallengeToken` — should fail once cross-checked against the credential lookup for the *token's own* tenant; confirm no cross-tenant leakage occurs even transiently.
- Brute-force a 6-digit code (only 1,000,000 possibilities) — confirm the 10-attempt lockout genuinely halts further tries; note there is no rate limiting independent of the lockout counter, so an attacker gets 10 free guesses at full network speed before being locked out.
- Tamper with the JWT payload of a valid challenge token (e.g. change `credentialUuid`) without re-signing — must fail signature verification → `AUTH_MFA_CHALLENGE_INVALID`.

### Performance Considerations
- TOTP verification (Speakeasy) is fast (HMAC-based); no meaningful latency contribution.
- Same lockout-counter contention consideration as `/login` applies here.

---

## 3. `POST /api/v1/auth/refresh`

### Description
Exchanges a valid refresh-token cookie for a new access token. Does not require re-entering credentials or MFA.

### Authentication Required
No Bearer token. **Cookie-authenticated**: a valid `refreshToken` cookie must be present.

### Headers

| Header | Required | Notes |
|---|---|---|
| `Cookie` | Yes (in practice) | Must include `refreshToken=<jwt>` — normally sent automatically by a browser; must be set explicitly with tools like curl/Postman. |

### Query Parameters
None.

### Path Parameters
None.

### Request Body
None expected/read.

### Validation Rules
None (no body is validated) — all correctness checks are against the cookie's JWT.

### Success Response
`200 OK`:
```json
{ "data": { "accessToken": "eyJhbGciOiJSUzI1NiIs..." } }
```
No new refresh-token cookie is set — the original refresh token remains valid and unchanged (no rotation).

### Error Responses

| Status | Code | Condition |
|---|---|---|
| 401 | `AUTH_INVALID_REFRESH_TOKEN` | No `refreshToken` cookie present at all. |
| 401 | `AUTH_INVALID_REFRESH_TOKEN` | Cookie present but not a well-formed/validly-signed JWT, or its `tenantId` claim can't be parsed. |
| 401 | `AUTH_INVALID_REFRESH_TOKEN` | JWT verifies but is expired (past its 7-day `exp`). |
| 401 | `AUTH_INVALID_REFRESH_TOKEN` | JWT cryptographically valid, but the corresponding DB record has been revoked (logged out, or a password reset happened) or its DB-side `expiresAt` has passed. |

### Status Codes
`200`, `401`.

### Example Request
```bash
curl -i -X POST http://localhost:4000/api/v1/auth/refresh \
  -H "Cookie: refreshToken=<jwt from /login>"
```

### Example Responses
No cookie sent:
```json
{ "error": { "code": "AUTH_INVALID_REFRESH_TOKEN", "message": "Refresh token is invalid, expired, or has been revoked." } }
```

### Business Rules
- Two independent checks must both pass: (1) the JWT's own signature and `exp` claim, and (2) a DB-side lookup confirming the token's `jti` is neither revoked nor past its own stored expiry — defense in depth (JWT-005).
- The refresh token is **not** rotated on use — the same refresh token remains valid for repeated `/refresh` calls until it naturally expires (7 days) or is explicitly revoked (logout, password reset).
- No re-authentication or MFA re-check occurs — this is purely "extend my access token," not a new login.

### Edge Cases
- Calling `/refresh` back-to-back many times in a tight loop with the same cookie is expected to keep succeeding — this is not "reuse" in the rotation-detection sense some systems implement; this system doesn't rotate, so there is nothing to detect.
- A refresh token whose JWT `exp` hasn't passed yet, but whose DB record's `expiresAt` *has* (these are set to the same 7-day value at issuance, so in normal operation they expire together — but if a test seeds the DB record with an artificially shorter `expiresAt`, the DB check will reject it before the JWT check would have) → still `AUTH_INVALID_REFRESH_TOKEN`.
- Logging out, then calling `/refresh` with the now-revoked token → `AUTH_INVALID_REFRESH_TOKEN` (this is the "reused refresh token" scenario the test-cases document below covers explicitly).

### Negative Test Cases
1. No cookie at all → 401 `AUTH_INVALID_REFRESH_TOKEN`.
2. Cookie present but garbage value (`refreshToken=not-a-jwt`) → 401 `AUTH_INVALID_REFRESH_TOKEN`.
3. Cookie is a validly-formed JWT but signed with the wrong (e.g. access-token) key → 401 `AUTH_INVALID_REFRESH_TOKEN`.
4. Expired refresh token (7+ days old, or a shorter-TTL fixture in tests) → 401 `AUTH_INVALID_REFRESH_TOKEN`.
5. Refresh token revoked via `/logout`, then reused here → 401 `AUTH_INVALID_REFRESH_TOKEN`.
6. Refresh token belonging to a different tenant than its own claim would imply (tamper with the `tenantId` claim without re-signing) → 401 `AUTH_INVALID_REFRESH_TOKEN` (signature check fails first).

### Security Test Cases
- Confirm the cookie is `HttpOnly` (not readable via `document.cookie` in a browser) and `Secure` (not sent over plain HTTP) and `SameSite=Strict` — inspect the actual `Set-Cookie` header from `/login`.
- Confirm there is **no CSRF protection currently implemented** on this endpoint — a proof-of-concept cross-site form submission (if the browser would attach the cookie under `SameSite=Strict`, which it normally won't for a top-level cross-site POST) is a documentation/awareness test, not expected to be "fixed" by this task.
- Attempt to submit a refresh token via the request **body** instead of a cookie — confirm it is ignored entirely (only the cookie is read).

### Performance Considerations
- No DB write occurs on a successful refresh (no rotation) — this is a cheap, read-only-plus-one-lookup operation, should be very fast and safe to call frequently (e.g. every 10–14 minutes to stay ahead of the 15-minute access-token expiry).

---

## 4. `POST /api/v1/auth/logout`

### Description
Revokes the current session's refresh token so it can no longer be used, and clears the cookie.

### Authentication Required
The module specification marks this **Bearer-authenticated**, but **this is not currently enforced** — no JWT-auth middleware exists yet. In practice, only a valid `refreshToken` cookie is required.

### Headers

| Header | Required | Notes |
|---|---|---|
| `Cookie` | Yes (in practice) | Must include `refreshToken=<jwt>`. |
| `Authorization: Bearer <accessToken>` | Documented as required by spec, **not actually checked** | Sending it or omitting it has no effect on the current behavior — flag this in any spec-compliance audit. |

### Query Parameters
None.

### Path Parameters
None.

### Request Body
None expected/read.

### Validation Rules
None (no body).

### Success Response
`204 No Content` (empty body). Also clears the `refreshToken` cookie (`Set-Cookie: refreshToken=; Max-Age=0` equivalent, via `res.clearCookie`).

### Error Responses

| Status | Code | Condition |
|---|---|---|
| 401 | `AUTH_INVALID_REFRESH_TOKEN` | No cookie, malformed/expired JWT, or unparseable `tenantId` claim. |

Note: logging out with an **already-revoked** token is *not* an error — see Business Rules.

### Status Codes
`204`, `401`.

### Example Request
```bash
curl -i -X POST http://localhost:4000/api/v1/auth/logout \
  -H "Cookie: refreshToken=<jwt from /login>"
```

### Example Responses
Success: `204 No Content`, empty body.
No cookie:
```json
{ "error": { "code": "AUTH_INVALID_REFRESH_TOKEN", "message": "Refresh token is invalid, expired, or has been revoked." } }
```

### Business Rules
- Logout is **idempotent by design for an already-revoked token**: if the JWT itself is valid but the DB record was already revoked (e.g. double-clicking logout, or logging out twice), the endpoint still returns `204` and does nothing further — it does not error. It only errors when the cookie is missing or the JWT itself doesn't verify.
- Only the one session tied to the presented refresh token is revoked — other active sessions for the same account are untouched (that's `/reset-password`'s job, which revokes *all* sessions).

### Edge Cases
- Logging out twice in a row with the same (now-clientside-cached) cookie → first call `204`, second call also `204` (idempotent no-op), not an error.
- Logging out with a refresh token that was never valid to begin with (garbage/tampered) → 401, not `204` — the idempotent no-op only applies to a token that *was* valid and is now revoked in the DB, not to a token that never verified.

### Negative Test Cases
1. No cookie → 401 `AUTH_INVALID_REFRESH_TOKEN`.
2. Garbage cookie value → 401 `AUTH_INVALID_REFRESH_TOKEN`.
3. Valid token, call logout twice in a row → both calls `204` (assert the *second* call does not error).
4. Expired refresh token → 401 `AUTH_INVALID_REFRESH_TOKEN`.

### Security Test Cases
- Confirm that after logout, the same refresh token can no longer be used at `/refresh` (expect `AUTH_INVALID_REFRESH_TOKEN`).
- Confirm the access token issued before logout is **not** itself invalidated — it remains valid (and usable against any endpoint that would accept it) until its own 15-minute expiry, since there is no access-token deny-list, only the refresh token is revoked. This is expected/documented JWT statelessness behavior, not a bug, but worth QA being aware of for security sign-off.

### Performance Considerations
- Single DB write (mark one `refresh_tokens` row revoked); no measurable performance concern.

---

## 5. `POST /api/v1/auth/forgot-password`

### Description
Requests a password reset. Always returns an identical, generic success message regardless of whether the account exists (enumeration-safe).

### Authentication Required
No (unauthenticated / allow-listed).

### Headers

| Header | Required | Notes |
|---|---|---|
| `Content-Type` | Yes | `application/json`. |

### Query Parameters
None.

### Path Parameters
None.

### Request Body
```json
{ "tenantId": "1", "email": "user@example.com" }
```

### Validation Rules

| Field | Rule |
|---|---|
| `tenantId` | Required, digits-only string. |
| `email` | Required, valid email format. |

### Success Response
`200 OK` — **always this exact body**, whether or not the account exists:
```json
{ "data": { "message": "If an account with that email exists, a password reset link has been sent." } }
```

### Error Responses

| Status | Code | Condition |
|---|---|---|
| 422 | `VALIDATION_ERROR` | Malformed body. |

There is no "account not found" error — that's the entire point of this endpoint.

### Status Codes
`200`, `422`.

### Example Request
```bash
curl -i -X POST http://localhost:4000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"1","email":"user@example.com"}'
```

### Example Responses
Identical for existing and nonexistent accounts:
```json
{ "data": { "message": "If an account with that email exists, a password reset link has been sent." } }
```

### Business Rules
- If the account exists: a random 256-bit token is generated, SHA-256-hashed, and stored with a 15-minute expiry. The **plaintext** token is generated but **never delivered anywhere** by the current implementation — no email is sent (SES integration is out of scope of what's built). There is currently no way to retrieve that plaintext token except by direct DB/repository access.
- If the account does not exist: nothing is created; the response is identical byte-for-byte to the exists-case.
- No invalidation of previously-issued, still-outstanding reset tokens occurs when a new one is requested (a documented gap — PWD-006 calls for this, the Repository layer doesn't yet expose a way to do it).

### Edge Cases
- Requesting a reset multiple times in a row for the same account creates multiple valid, independent reset tokens simultaneously — any one of them can later succeed at `/reset-password` (see gap above).
- Requesting for an email that exists in tenant A but not tenant B → identical generic response either way; no information is leaked either way.

### Negative Test Cases
1. Missing `email` → 422 `VALIDATION_ERROR`.
2. `tenantId` non-numeric → 422 `VALIDATION_ERROR`.
3. Malformed email format → 422 `VALIDATION_ERROR`.

### Security Test Cases
- **The core test for this endpoint**: submit a known-existing email and a definitely-nonexistent email, and assert the two HTTP responses are **identical** in status code, body, and headers (AUTHN-005 extended to this endpoint). Any observable difference is a regression.
- Timing comparison between the two cases above — the exists-case does an extra DB write (creating the token); a measurable timing difference is a theoretical side-channel worth flagging, though not one this implementation currently mitigates.
- SQL injection / XSS in `email` — same as `/login`'s email field; format validation should reject non-email-shaped payloads before any query executes.

### Performance Considerations
- The exists-case does one extra DB write (token creation) versus the not-exists-case (both do one read). Under load, this endpoint's cost is dominated by DB round-trips, not CPU (no password hashing occurs here).

---

## 6. `POST /api/v1/auth/reset-password`

### Description
Consumes a password-reset token to set a new password. On success, revokes every active session (refresh token) for the account.

### Authentication Required
No (unauthenticated); requires possession of a valid, unexpired, unused reset token instead.

### Headers

| Header | Required | Notes |
|---|---|---|
| `Content-Type` | Yes | `application/json`. |

### Query Parameters
None.

### Path Parameters
None.

### Request Body
```json
{ "tenantId": "1", "token": "<64-character hex string>", "newPassword": "a-new-strong-password" }
```

### Validation Rules

| Field | Rule |
|---|---|
| `tenantId` | Required, digits-only string. |
| `token` | Required, non-empty string (wire-shape only — no length/format check at the schema level; the actual 64-hex-char shape comes from how `/forgot-password` generates it, not from validation here). |
| `newPassword` | Required, non-empty at the schema level. Business-layer policy (PWD-003) additionally requires **12–128 characters** — enforced *after* schema validation, inside the use case, so a 5-character password passes Zod but fails with `AUTH_PASSWORD_POLICY_VIOLATION`. |

### Success Response
`200 OK`:
```json
{ "data": { "message": "Password has been reset successfully." } }
```

### Error Responses

| Status | Code | Condition |
|---|---|---|
| 422 | `VALIDATION_ERROR` | Missing/empty fields, non-numeric `tenantId`. |
| 422 | `AUTH_PASSWORD_POLICY_VIOLATION` | `newPassword` is <12 or >128 characters. Checked **before** the token itself is looked up. |
| 422 | `AUTH_INVALID_RESET_TOKEN` | Token not found, already used, or expired — all three collapse to this one response. |

### Status Codes
`200`, `422`.

### Example Request
```bash
curl -i -X POST http://localhost:4000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"1","token":"<token>","newPassword":"a-valid-new-password"}'
```

### Example Responses
Bad password length:
```json
{ "error": { "code": "AUTH_PASSWORD_POLICY_VIOLATION", "message": "Password must be between 12 and 128 characters." } }
```
Bad/expired/used token:
```json
{ "error": { "code": "AUTH_INVALID_RESET_TOKEN", "message": "Password reset token is invalid, expired, or has already been used." } }
```

### Business Rules
- Password policy is checked **first**, before the token is even looked up — an attacker cannot use this endpoint to probe token validity by varying the password length (both checks 422, but distinguishable by `code`, so this isn't a perfect enumeration defense — noted for awareness, not currently mitigated further).
- On success: the new password is Argon2id-hashed and stored, the token is marked used, and **every** refresh token for that account is revoked (all sessions logged out) — this is the "password reset = assume compromise" rule (SESS-005).
- The token is matched by SHA-256 hash lookup — the plaintext token itself is never stored.
- No breach-corpus check (PWD-004, e.g. HaveIBeenPwned) is implemented — a password like `"password12345"` (12+ characters, previously breached) will be accepted.
- No composition rule (no forced uppercase/digit/symbol) — this is intentional per PWD-003, not a gap.

### Edge Cases
- Reusing the same reset token twice in a row (e.g. double-submitting a form) → first call succeeds (`200`), second call with the identical token → `AUTH_INVALID_RESET_TOKEN` (now marked used).
- Setting the new password to the *same* value as the current password → succeeds; no "new password must differ from old" rule exists.
- A reset token for tenant A submitted with `tenantId` set to tenant B → treated as not found → `AUTH_INVALID_RESET_TOKEN` (the lookup is tenant-scoped).

### Negative Test Cases
1. `newPassword` of 11 characters → 422 `AUTH_PASSWORD_POLICY_VIOLATION`.
2. `newPassword` of exactly 12 characters → should succeed (boundary test) if the token is otherwise valid.
3. `newPassword` of 129 characters → 422 `AUTH_PASSWORD_POLICY_VIOLATION`.
4. `newPassword` of exactly 128 characters → should succeed (boundary test).
5. Nonexistent `token` value → 422 `AUTH_INVALID_RESET_TOKEN`.
6. Reused (already-used) token → 422 `AUTH_INVALID_RESET_TOKEN`.
7. Expired token (>15 minutes old) → 422 `AUTH_INVALID_RESET_TOKEN`.
8. Empty `token` field → 422 `VALIDATION_ERROR` (not `AUTH_INVALID_RESET_TOKEN` — this fails schema validation first).

### Security Test Cases
- Attempt a reset with a token belonging to a **different account** than the one you're trying to affect (should be structurally impossible — the token itself determines which credential is updated, `tenantId`/`token` are the only inputs, there's no separate "target account" field to tamper with).
- SQL injection / large-payload tests on `token` and `newPassword` — same Prisma-parameterization argument as elsewhere; also confirm an extremely long `newPassword` (well past 128 chars, e.g. 10,000 characters) is rejected by the policy check quickly, not passed through to Argon2 hashing (which would be a needless CPU cost — confirm the policy check genuinely happens before hashing, which it does per the code path).
- Confirm all of an account's sessions are actually dead after a reset — log in, capture the refresh token, reset the password, then confirm `/refresh` with the old refresh token now returns `AUTH_INVALID_REFRESH_TOKEN`.

### Performance Considerations
- Argon2id hashing occurs here too (same cost as login's verify) — expect measurable latency.
- `revokeAllRefreshTokens` is a single bulk `UPDATE` (not one query per session) — should stay fast even for an account with many active sessions.

---

## 7. `GET /health`

### Description
Liveness/readiness check — reports whether the service can currently serve traffic (specifically, whether its database is reachable).

### Authentication Required
No — explicitly unauthenticated, not tenant-scoped, not rate-limited (`10_DEPLOYMENT_ARCHITECTURE.md` HC-001).

### Headers
None required.

### Query Parameters
None.

### Path Parameters
None.

### Request Body
None.

### Validation Rules
None.

### Success Response
`200 OK`:
```json
{ "status": "ok" }
```
Note: **not** wrapped in the `{ "data": ... }` envelope — this is a deliberate, documented exception (HC-004).

### Error Responses

| Status | Condition |
|---|---|
| 503 | Database is unreachable (`SELECT 1` fails or times out via connection error). Body: `{ "status": "error" }`. |

There is no `GET /health/deep` (Platform-Operator diagnostic variant, HC-003) implemented — only the basic check exists.

### Status Codes
`200`, `503`.

### Example Request
```bash
curl -i http://localhost:4000/health
```

### Example Responses
```json
{ "status": "ok" }
```

### Business Rules
None (this is infrastructure, not business logic) — it directly pings the database via `SELECT 1` with no query timeout explicitly configured beyond Prisma/MySQL driver defaults.

### Edge Cases
- Database reachable but under heavy load (slow, not down) — `SELECT 1` will simply take longer; there is no explicit fast-timeout wrapper around it (HC-002 recommends "under 500ms"), so a sufficiently overloaded DB could make `/health` itself slow rather than fast-failing.
- Redis is **not** checked at all (no Redis client exists anywhere in this codebase yet, despite `REDIS_URL` being a documented env var) — do not expect `/health` to reflect Redis status.

### Negative Test Cases
1. Stop the local MySQL server, then call `/health` → expect `503 { "status": "error" }`.
2. Restart MySQL, call `/health` again → expect `200 { "status": "ok" }` once the connection pool recovers.

### Security Test Cases
- Confirm the response body never includes connection strings, stack traces, or any internal detail beyond the bare `status` field (HC-004) — inspect the 503 body closely; it currently only ever contains `{ "status": "error" }`.
- Confirm no authentication is required and none is enforced (by design) — this should not require a token of any kind under any circumstance.

### Performance Considerations
- Called frequently by load balancers/orchestrators (e.g. every few seconds) — currently does one real DB round-trip per call; there is no caching of the health result, so a very high health-check polling frequency will add proportional load to the database connection pool. Worth monitoring if the polling interval is aggressive.

---

*End of document. This is a snapshot of the implementation's actual current behavior, including its known gaps — update it whenever the Authentication module's contract changes (new endpoints, rate limiting added, CSRF implemented, etc.).*
