// Shared test fixtures/fakes for Business-layer unit tests
// (05_CODING_STANDARDS.md Ch.10.6 — a unit test constructs a fake `deps`
// object directly, no mocking framework/container required). Not a
// `.service.ts` file itself, so it carries no use-case naming suffix.
import { User } from "../../domain/aggregates/user.aggregate";
import { UserStatus } from "../../domain/enums/user-status.enum";
import { IUserManagementRepository } from "../../domain/interfaces/user-management-repository.interface";

export function buildUser(overrides: Partial<User> = {}): User {
  const base = new User(
    1n,
    "00000000-0000-0000-0000-000000000001",
    1n,
    "00000000-0000-0000-0000-000000000010",
    null,
    null,
    "Priya",
    null,
    "Sharma",
    null,
    "priya.sharma@example.com",
    null,
    UserStatus.Invited,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(User.prototype), base, overrides) as User;
}

export function createFakeUserManagementRepository(): jest.Mocked<IUserManagementRepository> {
  return {
    createUser: jest.fn(),
    findUserByUuid: jest.fn(),
    findUserByEmail: jest.fn(),
    findUsersByStatus: jest.fn(),
    updateUser: jest.fn(),
    activateUser: jest.fn(),
    suspendUser: jest.fn(),
    deactivateUser: jest.fn(),
    listUsersByTenant: jest.fn(),
    listUsersByCompany: jest.fn(),
    searchUsers: jest.fn(),
  };
}
