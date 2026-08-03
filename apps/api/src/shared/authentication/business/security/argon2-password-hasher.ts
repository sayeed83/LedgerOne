import * as argon2 from "argon2";
import { IPasswordHasher } from "../../domain/interfaces/password-hasher.interface";

// PWD-002: Argon2id, memory cost >= 19 MiB, iteration count >= 2, parallelism = 1.
const MEMORY_COST_KIB = 19 * 1024;
const TIME_COST = 2;
const PARALLELISM = 1;

export class Argon2PasswordHasher implements IPasswordHasher {
  async hash(plainTextPassword: string): Promise<string> {
    return argon2.hash(plainTextPassword, {
      type: argon2.argon2id,
      memoryCost: MEMORY_COST_KIB,
      timeCost: TIME_COST,
      parallelism: PARALLELISM,
    });
  }

  async verify(hash: string, plainTextPassword: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plainTextPassword);
    } catch {
      return false;
    }
  }
}
