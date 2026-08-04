import { getTaxGroup, GetTaxGroupDeps } from "./get-tax-group.service";
import { TaxGroupNotFoundError } from "../domain/errors/accounting.errors";
import { buildTaxGroup, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): GetTaxGroupDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("getTaxGroup", () => {
  it("throws TaxGroupNotFoundError when no Tax Group matches the uuid under the given tenant", async () => {
    const deps = buildDeps();
    (deps.repository.findTaxGroupByUuid as jest.Mock).mockResolvedValue(null);

    await expect(getTaxGroup({ tenantId: 1n, taxGroupUuid: "00000000-0000-0000-0000-000000000400" }, deps)).rejects.toThrow(
      TaxGroupNotFoundError,
    );
  });

  it("returns the Tax Group when found", async () => {
    const deps = buildDeps();
    const taxGroup = buildTaxGroup();
    (deps.repository.findTaxGroupByUuid as jest.Mock).mockResolvedValue(taxGroup);

    const result = await getTaxGroup({ tenantId: 1n, taxGroupUuid: taxGroup.uuid }, deps);

    expect(result).toBe(taxGroup);
  });
});
