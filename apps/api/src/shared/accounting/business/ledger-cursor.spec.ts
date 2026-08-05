import { encodeLedgerCursor, decodeLedgerCursor } from "./ledger-cursor";
import { InvalidLedgerCursorError } from "../domain/errors/accounting.errors";

describe("ledger-cursor", () => {
  it("round-trips an encoded position back to an equivalent entryDate/uuid pair", () => {
    const entryDate = new Date("2026-04-15T10:30:00.000Z");
    const encoded = encodeLedgerCursor({ entryDate, uuid: "00000000-0000-0000-0000-000000000900" });

    const decoded = decodeLedgerCursor(encoded);

    expect(decoded.entryDate.toISOString()).toBe(entryDate.toISOString());
    expect(decoded.uuid).toBe("00000000-0000-0000-0000-000000000900");
  });

  it("produces an opaque token that is not literally the entryDate/uuid (PAG-003)", () => {
    const encoded = encodeLedgerCursor({ entryDate: new Date("2026-04-15T00:00:00.000Z"), uuid: "00000000-0000-0000-0000-000000000900" });

    expect(encoded).not.toContain("2026-04-15");
    expect(encoded).not.toContain("00000000-0000-0000-0000-000000000900");
  });

  it("throws InvalidLedgerCursorError for a cursor that is not valid base64url JSON", () => {
    expect(() => decodeLedgerCursor("not-a-real-cursor!!!")).toThrow(InvalidLedgerCursorError);
  });

  it("throws InvalidLedgerCursorError for a well-formed-base64 payload missing required fields", () => {
    const malformed = Buffer.from(JSON.stringify({ foo: "bar" }), "utf8").toString("base64url");

    expect(() => decodeLedgerCursor(malformed)).toThrow(InvalidLedgerCursorError);
  });

  it("throws InvalidLedgerCursorError when entryDate is not a valid date string", () => {
    const malformed = Buffer.from(JSON.stringify({ entryDate: "not-a-date", uuid: "x" }), "utf8").toString("base64url");

    expect(() => decodeLedgerCursor(malformed)).toThrow(InvalidLedgerCursorError);
  });
});
