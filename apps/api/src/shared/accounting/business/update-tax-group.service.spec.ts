import { updateTaxGroup, UpdateTaxGroupDeps } from "./update-tax-group.service";
import { TaxGroupNotFoundError, DuplicateTaxGroupNameError } from "../domain/errors/accounting.errors";
import { buildTaxGroup, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): UpdateTaxGroupDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("updateTaxGroup", () => {
  it("throws TaxGroupNotFoundError when the Tax Group does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTaxGroupByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateTaxGroup({ tenantId: 1n, taxGroupUuid: "00000000-0000-0000-0000-000000000400", name: "Revised" }, deps),
    ).rejects.toThrow(TaxGroupNotFoundError);
    expect(deps.repository.updateTaxGroup).not.toHaveBeenCalled();
  });

  it("throws DuplicateTaxGroupNameError when renaming to a name another Tax Group in the same Company already uses", async () => {
    const deps = buildDeps();
    const taxGroup = buildTaxGroup({ uuid: "00000000-0000-0000-0000-000000000400", name: "Standard Rate" });
    const other = buildTaxGroup({ uuid: "00000000-0000-0000-0000-000000000401", name: "Zero Rate" });
    (deps.repository.findTaxGroupByUuid as jest.Mock).mockResolvedValue(taxGroup);
    (deps.repository.listTaxGroups as jest.Mock).mockResolvedValue([taxGroup, other]);

    await expect(
      updateTaxGroup({ tenantId: 1n, taxGroupUuid: taxGroup.uuid, name: "Zero Rate" }, deps),
    ).rejects.toThrow(DuplicateTaxGroupNameError);
    expect(deps.repository.updateTaxGroup).not.toHaveBeenCalled();
  });

  it("does not re-check duplicates when the name is unchanged", async () => {
    const deps = buildDeps();
    const taxGroup = buildTaxGroup({ uuid: "00000000-0000-0000-0000-000000000400", name: "Standard Rate" });
    (deps.repository.findTaxGroupByUuid as jest.Mock).mockResolvedValue(taxGroup);
    (deps.repository.updateTaxGroup as jest.Mock).mockResolvedValue(taxGroup);

    await updateTaxGroup({ tenantId: 1n, taxGroupUuid: taxGroup.uuid, name: "Standard Rate" }, deps);

    expect(deps.repository.listTaxGroups).not.toHaveBeenCalled();
    expect(deps.repository.updateTaxGroup).toHaveBeenCalled();
  });

  it("updates the Tax Group when the new name is not a duplicate", async () => {
    const deps = buildDeps();
    const taxGroup = buildTaxGroup({ uuid: "00000000-0000-0000-0000-000000000400", name: "Standard Rate" });
    (deps.repository.findTaxGroupByUuid as jest.Mock).mockResolvedValue(taxGroup);
    (deps.repository.listTaxGroups as jest.Mock).mockResolvedValue([taxGroup]);
    (deps.repository.updateTaxGroup as jest.Mock).mockResolvedValue(buildTaxGroup({ name: "Standard Rate (Revised)" }));

    await updateTaxGroup({ tenantId: 1n, taxGroupUuid: taxGroup.uuid, name: "Standard Rate (Revised)", updatedBy: 7n }, deps);

    expect(deps.repository.updateTaxGroup).toHaveBeenCalledWith(1n, taxGroup.uuid, {
      name: "Standard Rate (Revised)",
      updatedBy: 7n,
    });
  });
});
