import { DecimalValue } from "./decimal-value.value-object";

describe("DecimalValue", () => {
  describe("add", () => {
    it("adds two positive values exactly", () => {
      expect(DecimalValue.create("100.25").add(DecimalValue.create("50.10")).toString()).toBe("150.35");
    });

    it("adds values with different decimal scales without floating-point drift", () => {
      expect(DecimalValue.create("0.1").add(DecimalValue.create("0.2")).toString()).toBe("0.3");
    });

    it("adds a negative and a positive value", () => {
      expect(DecimalValue.create("100").add(DecimalValue.create("-40")).toString()).toBe("60");
    });

    it("adds two values that sum to exactly zero, normalizing away the sign", () => {
      expect(DecimalValue.create("25.5").add(DecimalValue.create("-25.5")).toString()).toBe("0");
    });

    it("adds large-magnitude values exactly (DECIMAL(20,4) column range)", () => {
      expect(DecimalValue.create("99999999999999.9999").add(DecimalValue.create("0.0001")).toString()).toBe("100000000000000");
    });
  });

  describe("subtract", () => {
    it("subtracts a smaller value from a larger one", () => {
      expect(DecimalValue.create("100").subtract(DecimalValue.create("40")).toString()).toBe("60");
    });

    it("subtracts a larger value from a smaller one, producing a negative result", () => {
      expect(DecimalValue.create("40").subtract(DecimalValue.create("100")).toString()).toBe("-60");
    });

    it("subtracting zero returns the original value", () => {
      expect(DecimalValue.create("42.5").subtract(DecimalValue.create("0")).toString()).toBe("42.5");
    });

    it("subtracting a value from itself is exactly zero", () => {
      expect(DecimalValue.create("83.1234").subtract(DecimalValue.create("83.1234")).toString()).toBe("0");
    });
  });
});
