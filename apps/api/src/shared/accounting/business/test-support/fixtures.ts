// Shared test fixtures/fakes for Business-layer unit tests
// (05_CODING_STANDARDS.md Ch.10.6 — a unit test constructs a fake `deps`
// object directly, no mocking framework/container required). Not a
// `.service.ts` file itself, so it carries no use-case naming suffix.
import { FinancialYear } from "../../domain/aggregates/financial-year.aggregate";
import { FinancialYearStatus } from "../../domain/enums/financial-year-status.enum";
import { IAccountingRepository } from "../../domain/interfaces/accounting-repository.interface";

export function buildFinancialYear(overrides: Partial<FinancialYear> = {}): FinancialYear {
  const base = new FinancialYear(
    1n,
    "00000000-0000-0000-0000-000000000001",
    1n,
    "00000000-0000-0000-0000-000000000100",
    new Date("2026-04-01T00:00:00.000Z"),
    new Date("2027-03-31T00:00:00.000Z"),
    FinancialYearStatus.Future,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(FinancialYear.prototype), base, overrides) as FinancialYear;
}

export function createFakeAccountingRepository(): jest.Mocked<IAccountingRepository> {
  return {
    createFinancialYear: jest.fn(),
    findFinancialYearByUuid: jest.fn(),
    listFinancialYears: jest.fn(),
    updateFinancialYear: jest.fn(),
    openFinancialYear: jest.fn(),
    closeFinancialYear: jest.fn(),
    reopenFinancialYear: jest.fn(),
  };
}
