import { createHash, randomBytes } from "crypto";

// Not behind an interface: this is a deterministic, effect-free
// transformation (no randomness to fake in generateResetToken's caller,
// no clock/IO in hashResetToken) — unlike password hashing/JWTs/TOTP, tests
// don't need to substitute it, per 05_CODING_STANDARDS.md Ch.10.3's guidance
// that the Dependencies object exists for genuine collaborators, not every
// function. The token's secrecy comes from its 256 bits of randomness, so a
// fast hash (not Argon2id) is correct here — it's a lookup key, not a
// low-entropy secret to slow down guessing against.
export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashResetToken(plainTextToken: string): string {
  return createHash("sha256").update(plainTextToken).digest("hex");
}
