import { listTaxRules, ListTaxRulesDeps } from "./list-tax-rules.service";
import { TaxGroupNotFoundError } from "../domain/errors/accounting.errors";
import { buildTaxGroup, buildTaxRule, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): ListTaxRulesDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("listTaxRules", () => {
  it("lists tenant-wide when no taxGroupUuid filter is given", async () => {
    const deps = buildDeps();
    (deps.repository.listTaxRules as jest.Mock).mockResolvedValue([]);

    await listTaxRules({ tenantId: 1n }, deps);

    expect(deps.repository.findTaxGroupByUuid).not.toHaveBeenCalled();
    expect(deps.repository.listTaxRules).toHaveBeenCalledWith(1n, undefined);
  });

  it("resolves taxGroupUuid to its internal id before filtering", async () => {
    const deps = buildDeps();
    const taxGroup = buildTaxGroup({ id: 10n, uuid: "00000000-0000-0000-0000-000000000400" });
    const rules = [buildTaxRule({ taxGroupId: 10n })];
    (deps.repository.findTaxGroupByUuid as jest.Mock).mockResolvedValue(taxGroup);
    (deps.repository.listTaxRules as jest.Mock).mockResolvedValue(rules);

    const result = await listTaxRules({ tenantId: 1n, taxGroupUuid: taxGroup.uuid }, deps);

    expect(deps.repository.listTaxRules).toHaveBeenCalledWith(1n, 10n);
    expect(result).toBe(rules);
  });

  it("throws TaxGroupNotFoundError when the filtering Tax Group does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTaxGroupByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      listTaxRules({ tenantId: 1n, taxGroupUuid: "00000000-0000-0000-0000-000000000400" }, deps),
    ).rejects.toThrow(TaxGroupNotFoundError);
    expect(deps.repository.listTaxRules).not.toHaveBeenCalled();
  });
});
