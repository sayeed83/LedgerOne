import { getTaxRule, GetTaxRuleDeps } from "./get-tax-rule.service";
import { TaxRuleNotFoundError } from "../domain/errors/accounting.errors";
import { buildTaxRule, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): GetTaxRuleDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("getTaxRule", () => {
  it("throws TaxRuleNotFoundError when no Tax Rule matches the uuid under the given tenant", async () => {
    const deps = buildDeps();
    (deps.repository.findTaxRuleByUuid as jest.Mock).mockResolvedValue(null);

    await expect(getTaxRule({ tenantId: 1n, taxRuleUuid: "00000000-0000-0000-0000-000000000500" }, deps)).rejects.toThrow(
      TaxRuleNotFoundError,
    );
  });

  it("returns the Tax Rule when found", async () => {
    const deps = buildDeps();
    const taxRule = buildTaxRule();
    (deps.repository.findTaxRuleByUuid as jest.Mock).mockResolvedValue(taxRule);

    const result = await getTaxRule({ tenantId: 1n, taxRuleUuid: taxRule.uuid }, deps);

    expect(result).toBe(taxRule);
  });
});
