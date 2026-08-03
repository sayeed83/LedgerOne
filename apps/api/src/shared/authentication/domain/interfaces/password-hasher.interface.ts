// Domain-owned collaborator interface (03_ARCHITECTURE.md Decision 5.7.2).
// Business-layer use cases depend on this contract, never on `argon2`
// directly, so a use case's test can supply a fake instead of paying
// Argon2id's deliberately-slow real cost.
export interface IPasswordHasher {
  hash(plainTextPassword: string): Promise<string>;
  verify(hash: string, plainTextPassword: string): Promise<boolean>;
}
