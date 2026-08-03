// Repository layer for the Authentication module — persistence only.
// No password hashing, no JWT issuance/verification, no lockout/expiry
// decisions, no HTTP concerns (05_CODING_STANDARDS.md Ch.14.4). Every query
// filters by tenantId with no exception (03_ARCHITECTURE.md Ch.4, MT-002).
// Only this folder (and the shared Prisma client module itself) may import
// the Prisma client, per Ch.9.5.
import { randomUUID } from "crypto";
import { prisma, PrismaTransactionClient } from "../../../database/client";
import {
  UserCredential as UserCredentialModel,
  RefreshToken as RefreshTokenModel,
  PasswordResetToken as PasswordResetTokenModel,
  LoginAttempt as LoginAttemptModel,
} from "../../../database/generated/client";
import { UserCredential, CreateUserCredentialProps } from "../domain/aggregates/user-credential.aggregate";
import { RefreshToken, CreateRefreshTokenProps } from "../domain/entities/refresh-token.entity";
import { PasswordResetToken, CreatePasswordResetTokenProps } from "../domain/entities/password-reset-token.entity";
import { LoginAttempt, RecordLoginAttemptProps } from "../domain/entities/login-attempt.entity";
import { IAuthenticationRepository, RepositoryTransaction } from "../domain/interfaces/authentication-repository.interface";

function toUserCredentialDomain(row: UserCredentialModel): UserCredential {
  return new UserCredential(
    row.id,
    row.uuid,
    row.tenantId,
    row.userUuid,
    row.email,
    row.passwordHash,
    row.isMfaEnabled,
    row.mfaSecret,
    row.failedLoginCount,
    row.lockedUntil,
    row.lastLoginAt,
    row.createdAt,
    row.updatedAt,
    row.createdBy,
    row.updatedBy,
    row.deletedAt,
  );
}

function toRefreshTokenDomain(row: RefreshTokenModel): RefreshToken {
  return new RefreshToken(
    row.id,
    row.uuid,
    row.tenantId,
    row.userCredentialId,
    row.jti,
    row.expiresAt,
    row.revokedAt,
    row.createdFromIp,
    row.createdAt,
    row.updatedAt,
  );
}

function toPasswordResetTokenDomain(row: PasswordResetTokenModel): PasswordResetToken {
  return new PasswordResetToken(
    row.id,
    row.uuid,
    row.tenantId,
    row.userCredentialId,
    row.tokenHash,
    row.expiresAt,
    row.usedAt,
    row.createdAt,
    row.updatedAt,
  );
}

function toLoginAttemptDomain(row: LoginAttemptModel): LoginAttempt {
  return new LoginAttempt(
    row.id,
    row.uuid,
    row.tenantId,
    row.userCredentialId,
    row.emailAttempted,
    row.isSuccessful,
    row.sourceIp,
    row.userAgent,
    row.createdAt,
    row.updatedAt,
  );
}

/** Generates the external identifier assigned at insert time (06_DATABASE_STANDARDS.md PK-002 — generated in the application layer, not a MySQL default expression). */
function newUuid(): string {
  return randomUUID();
}

export class PrismaAuthenticationRepository implements IAuthenticationRepository {
  private client(tx?: RepositoryTransaction): PrismaTransactionClient | typeof prisma {
    return (tx as PrismaTransactionClient | undefined) ?? prisma;
  }

  // --- Credentials ---

  async findCredentialByEmail(tenantId: bigint, email: string): Promise<UserCredential | null> {
    const row = await prisma.userCredential.findFirst({
      where: { tenantId, email, deletedAt: null },
    });
    return row ? toUserCredentialDomain(row) : null;
  }

  async findCredentialByUuid(tenantId: bigint, uuid: string): Promise<UserCredential | null> {
    const row = await prisma.userCredential.findFirst({
      where: { tenantId, uuid, deletedAt: null },
    });
    return row ? toUserCredentialDomain(row) : null;
  }

  async createCredential(
    tenantId: bigint,
    props: CreateUserCredentialProps,
    tx?: RepositoryTransaction,
  ): Promise<UserCredential> {
    const row = await this.client(tx).userCredential.create({
      data: {
        uuid: newUuid(),
        tenantId,
        userUuid: props.userUuid,
        email: props.email,
        passwordHash: props.passwordHash,
        createdBy: props.createdBy ?? null,
      },
    });
    return toUserCredentialDomain(row);
  }

  async updatePasswordHash(
    tenantId: bigint,
    credentialId: bigint,
    passwordHash: string,
    tx?: RepositoryTransaction,
  ): Promise<UserCredential> {
    const row = await this.client(tx).userCredential.update({
      where: { id: credentialId, tenantId },
      data: { passwordHash },
    });
    return toUserCredentialDomain(row);
  }

  async incrementFailedLoginAttempts(
    tenantId: bigint,
    credentialId: bigint,
    tx?: RepositoryTransaction,
  ): Promise<UserCredential> {
    const row = await this.client(tx).userCredential.update({
      where: { id: credentialId, tenantId },
      data: { failedLoginCount: { increment: 1 } },
    });
    return toUserCredentialDomain(row);
  }

  async resetFailedLoginAttempts(
    tenantId: bigint,
    credentialId: bigint,
    tx?: RepositoryTransaction,
  ): Promise<UserCredential> {
    const row = await this.client(tx).userCredential.update({
      where: { id: credentialId, tenantId },
      data: { failedLoginCount: 0 },
    });
    return toUserCredentialDomain(row);
  }

  async lockAccount(
    tenantId: bigint,
    credentialId: bigint,
    lockedUntil: Date,
    tx?: RepositoryTransaction,
  ): Promise<UserCredential> {
    const row = await this.client(tx).userCredential.update({
      where: { id: credentialId, tenantId },
      data: { lockedUntil },
    });
    return toUserCredentialDomain(row);
  }

  async unlockAccount(
    tenantId: bigint,
    credentialId: bigint,
    tx?: RepositoryTransaction,
  ): Promise<UserCredential> {
    const row = await this.client(tx).userCredential.update({
      where: { id: credentialId, tenantId },
      data: { lockedUntil: null },
    });
    return toUserCredentialDomain(row);
  }

  // --- Refresh tokens (sessions) ---

  async createRefreshToken(
    tenantId: bigint,
    props: CreateRefreshTokenProps,
    tx?: RepositoryTransaction,
  ): Promise<RefreshToken> {
    const row = await this.client(tx).refreshToken.create({
      data: {
        uuid: newUuid(),
        tenantId,
        userCredentialId: props.userCredentialId,
        jti: props.jti,
        expiresAt: props.expiresAt,
        createdFromIp: props.createdFromIp,
      },
    });
    return toRefreshTokenDomain(row);
  }

  async findValidRefreshToken(tenantId: bigint, jti: string): Promise<RefreshToken | null> {
    const row = await prisma.refreshToken.findFirst({
      where: { tenantId, jti, revokedAt: null, expiresAt: { gt: new Date() } },
    });
    return row ? toRefreshTokenDomain(row) : null;
  }

  async revokeRefreshToken(tenantId: bigint, refreshTokenId: bigint, tx?: RepositoryTransaction): Promise<void> {
    await this.client(tx).refreshToken.update({
      where: { id: refreshTokenId, tenantId },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllRefreshTokens(
    tenantId: bigint,
    userCredentialId: bigint,
    tx?: RepositoryTransaction,
  ): Promise<number> {
    const result = await this.client(tx).refreshToken.updateMany({
      where: { tenantId, userCredentialId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }

  // --- Password reset tokens ---

  async createPasswordResetToken(
    tenantId: bigint,
    props: CreatePasswordResetTokenProps,
    tx?: RepositoryTransaction,
  ): Promise<PasswordResetToken> {
    const row = await this.client(tx).passwordResetToken.create({
      data: {
        uuid: newUuid(),
        tenantId,
        userCredentialId: props.userCredentialId,
        tokenHash: props.tokenHash,
        expiresAt: props.expiresAt,
      },
    });
    return toPasswordResetTokenDomain(row);
  }

  async findPasswordResetToken(tenantId: bigint, tokenHash: string): Promise<PasswordResetToken | null> {
    const row = await prisma.passwordResetToken.findFirst({
      where: { tenantId, tokenHash },
    });
    return row ? toPasswordResetTokenDomain(row) : null;
  }

  async markPasswordResetTokenUsed(tenantId: bigint, tokenId: bigint, tx?: RepositoryTransaction): Promise<void> {
    await this.client(tx).passwordResetToken.update({
      where: { id: tokenId, tenantId },
      data: { usedAt: new Date() },
    });
  }

  // --- Login attempts ---

  async recordLoginAttempt(
    tenantId: bigint,
    props: RecordLoginAttemptProps,
    tx?: RepositoryTransaction,
  ): Promise<LoginAttempt> {
    const row = await this.client(tx).loginAttempt.create({
      data: {
        uuid: newUuid(),
        tenantId,
        userCredentialId: props.userCredentialId,
        emailAttempted: props.emailAttempted,
        isSuccessful: props.isSuccessful,
        sourceIp: props.sourceIp,
        userAgent: props.userAgent ?? null,
      },
    });
    return toLoginAttemptDomain(row);
  }
}
