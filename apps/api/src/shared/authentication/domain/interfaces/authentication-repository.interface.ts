// Repository interface, owned by the Domain layer per 03_ARCHITECTURE.md
// Decision 5.7.2 — the Repository layer provides the implementation, never
// the contract. Every method is persistence-only (05_CODING_STANDARDS.md
// Ch.14.4): no password hashing, no JWT handling, no lockout/expiry
// decisions — those are Business-layer concerns that call these methods.
//
// Every method takes `tenantId` as its first parameter and filters by it
// with no exception (03_ARCHITECTURE.md Ch.4, MT-002/06_DATABASE_STANDARDS.md).
// Find methods return `null`, never throw, when nothing matches
// (05_CODING_STANDARDS.md Ch.8.5/Ch.14).
import { UserCredential, CreateUserCredentialProps } from "../aggregates/user-credential.aggregate";
import { RefreshToken, CreateRefreshTokenProps } from "../entities/refresh-token.entity";
import { PasswordResetToken, CreatePasswordResetTokenProps } from "../entities/password-reset-token.entity";
import { LoginAttempt, RecordLoginAttemptProps } from "../entities/login-attempt.entity";

/**
 * Opaque handle for an in-flight transaction, supplied by the Business
 * layer's `$transaction` callback (03_ARCHITECTURE.md Decision 5.7.3 —
 * transactions are opened only at the Business layer) and passed through
 * unmodified. Kept as `unknown` rather than a Prisma-specific type so this
 * Domain-owned interface stays free of ORM types (Ch.5.3.4); the Repository
 * implementation casts it back to Prisma's transaction client internally.
 */
export type RepositoryTransaction = unknown;

export interface IAuthenticationRepository {
  // --- Credentials ---
  findCredentialByEmail(tenantId: bigint, email: string): Promise<UserCredential | null>;
  findCredentialByUuid(tenantId: bigint, uuid: string): Promise<UserCredential | null>;
  createCredential(tenantId: bigint, props: CreateUserCredentialProps, tx?: RepositoryTransaction): Promise<UserCredential>;
  updatePasswordHash(tenantId: bigint, credentialId: bigint, passwordHash: string, tx?: RepositoryTransaction): Promise<UserCredential>;
  incrementFailedLoginAttempts(tenantId: bigint, credentialId: bigint, tx?: RepositoryTransaction): Promise<UserCredential>;
  resetFailedLoginAttempts(tenantId: bigint, credentialId: bigint, tx?: RepositoryTransaction): Promise<UserCredential>;
  lockAccount(tenantId: bigint, credentialId: bigint, lockedUntil: Date, tx?: RepositoryTransaction): Promise<UserCredential>;
  unlockAccount(tenantId: bigint, credentialId: bigint, tx?: RepositoryTransaction): Promise<UserCredential>;

  // --- Refresh tokens (sessions) ---
  createRefreshToken(tenantId: bigint, props: CreateRefreshTokenProps, tx?: RepositoryTransaction): Promise<RefreshToken>;
  findValidRefreshToken(tenantId: bigint, jti: string): Promise<RefreshToken | null>;
  revokeRefreshToken(tenantId: bigint, refreshTokenId: bigint, tx?: RepositoryTransaction): Promise<void>;
  revokeAllRefreshTokens(tenantId: bigint, userCredentialId: bigint, tx?: RepositoryTransaction): Promise<number>;

  // --- Password reset tokens ---
  createPasswordResetToken(tenantId: bigint, props: CreatePasswordResetTokenProps, tx?: RepositoryTransaction): Promise<PasswordResetToken>;
  findPasswordResetToken(tenantId: bigint, tokenHash: string): Promise<PasswordResetToken | null>;
  markPasswordResetTokenUsed(tenantId: bigint, tokenId: bigint, tx?: RepositoryTransaction): Promise<void>;

  // --- Login attempts ---
  recordLoginAttempt(tenantId: bigint, props: RecordLoginAttemptProps, tx?: RepositoryTransaction): Promise<LoginAttempt>;
}
