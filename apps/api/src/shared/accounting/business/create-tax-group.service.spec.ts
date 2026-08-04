import { createTaxGroup, CreateTaxGroupDeps, CreateTaxGroupInput } from "./create-tax-group.service";
import { DuplicateTaxGroupNameError } from "../domain/errors/accounting.errors";
import { buildTaxGroup, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): CreateTaxGroupDeps {
  return { repository: createFakeAccountingRepository() };
}

function buildInput(overrides: Partial<CreateTaxGroupInput> = {}): CreateTaxGroupInput {
  return {
    tenantId: 1n,
    companyUuid: "00000000-0000-0000-0000-000000000100",
    name: "Standard Rate",
    ...overrides,
  };
}

describe("createTaxGroup", () => {
  it("throws DuplicateTaxGroupNameError when a Tax Group with the same name already exists for the Company", async () => {
    const deps = buildDeps();
    (deps.repository.listTaxGroups as jest.Mock).mockResolvedValue([buildTaxGroup({ name: "Standard Rate" })]);

    await expect(createTaxGroup(buildInput(), deps)).rejects.toThrow(DuplicateTaxGroupNameError);
    expect(deps.repository.createTaxGroup).not.toHaveBeenCalled();
  });

  it("creates the Tax Group when no other Tax Group in the Company shares its name", async () => {
    const deps = buildDeps();
    (deps.repository.listTaxGroups as jest.Mock).mockResolvedValue([buildTaxGroup({ name: "Zero Rate" })]);
    (deps.repository.createTaxGroup as jest.Mock).mockResolvedValue(buildTaxGroup());

    await createTaxGroup(buildInput({ createdBy: 5n }), deps);

    expect(deps.repository.createTaxGroup).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      name: "Standard Rate",
      createdBy: 5n,
    });
  });

  it("creates the Tax Group when no Tax Group exists yet for the Company", async () => {
    const deps = buildDeps();
    (deps.repository.listTaxGroups as jest.Mock).mockResolvedValue([]);
    (deps.repository.createTaxGroup as jest.Mock).mockResolvedValue(buildTaxGroup());

    await createTaxGroup(buildInput(), deps);

    expect(deps.repository.createTaxGroup).toHaveBeenCalled();
  });
});
