import { User } from "./user.aggregate";
import { UserStatus } from "../enums/user-status.enum";
import { InvalidUserStatusTransitionError } from "../errors/user-management.errors";

function buildUser(status: UserStatus): User {
  return new User(
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
    "priya.sharma@acme.example.com",
    null,
    status,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
}

describe("User lifecycle transitions (00_BUSINESS_RULES.md Ch.10.5)", () => {
  describe("activate", () => {
    it("allows Invited -> Active", () => {
      const result = buildUser(UserStatus.Invited).activate();
      expect(result.status).toBe(UserStatus.Active);
    });

    it("allows Suspended -> Active", () => {
      const result = buildUser(UserStatus.Suspended).activate();
      expect(result.status).toBe(UserStatus.Active);
    });

    it("rejects Active -> Active", () => {
      expect(() => buildUser(UserStatus.Active).activate()).toThrow(InvalidUserStatusTransitionError);
    });

    it("rejects Deactivated -> Active", () => {
      expect(() => buildUser(UserStatus.Deactivated).activate()).toThrow(InvalidUserStatusTransitionError);
    });

    it("does not mutate the original instance", () => {
      const original = buildUser(UserStatus.Invited);
      original.activate();
      expect(original.status).toBe(UserStatus.Invited);
    });
  });

  describe("suspend", () => {
    it("allows Active -> Suspended", () => {
      const result = buildUser(UserStatus.Active).suspend();
      expect(result.status).toBe(UserStatus.Suspended);
    });

    it("rejects Invited -> Suspended", () => {
      expect(() => buildUser(UserStatus.Invited).suspend()).toThrow(InvalidUserStatusTransitionError);
    });

    it("rejects Deactivated -> Suspended", () => {
      expect(() => buildUser(UserStatus.Deactivated).suspend()).toThrow(InvalidUserStatusTransitionError);
    });
  });

  describe("deactivate", () => {
    it("allows Active -> Deactivated", () => {
      const result = buildUser(UserStatus.Active).deactivate();
      expect(result.status).toBe(UserStatus.Deactivated);
    });

    it("rejects Invited -> Deactivated", () => {
      expect(() => buildUser(UserStatus.Invited).deactivate()).toThrow(InvalidUserStatusTransitionError);
    });

    it("rejects Suspended -> Deactivated", () => {
      expect(() => buildUser(UserStatus.Suspended).deactivate()).toThrow(InvalidUserStatusTransitionError);
    });

    it("rejects Deactivated -> Deactivated (terminal state)", () => {
      expect(() => buildUser(UserStatus.Deactivated).deactivate()).toThrow(InvalidUserStatusTransitionError);
    });
  });
});
