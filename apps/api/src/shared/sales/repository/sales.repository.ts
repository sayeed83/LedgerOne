// Repository layer for the Sales module — persistence only. No
// duplicate-name detection, no credit-limit/outstanding-balance validation
// (CUS-002), no status-transition rule (Ch.45.5), no HTTP concerns
// (05_CODING_STANDARDS.md Ch.14.4). `customers` is tenant-owned (MT-001) —
// every query below asserts `tenantId` explicitly. Only this folder (and the
// shared Prisma client module itself) may import the Prisma client, per
// Ch.9.5.
import { randomUUID } from "crypto";
import { prisma, PrismaTransactionClient } from "../../../database/client";
import { Customer as CustomerModel, CustomerStatus as PrismaCustomerStatus } from "../../../database/generated/client";
import { Customer, CreateCustomerProps, UpdateCustomerProps } from "../domain/entities/customer.entity";
import { CustomerStatus } from "../domain/enums/customer-status.enum";
import { CustomerNotFoundError } from "../domain/errors/sales.errors";
import { ISalesRepository, RepositoryTransaction } from "../domain/interfaces/sales-repository.interface";

function newUuid(): string {
  return randomUUID();
}

/// `.toFixed()` (not `.toString()`) guarantees plain fixed-point decimal
/// notation, never exponential notation, mirroring Inventory's own
/// `toReorderLevelDomain`'s `reorderLevel`/`reorderQuantity` mapping — kept
/// as a plain string here since a cross-module Domain import is
/// architecturally forbidden at this layer (see unit.entity.ts's own header
/// comment, inventory module).
function toCustomerDomain(row: CustomerModel): Customer {
  return new Customer(
    row.id,
    row.uuid,
    row.tenantId,
    row.companyUuid,
    row.name,
    row.addressLine1,
    row.addressLine2,
    row.city,
    row.region,
    row.postalCode,
    row.countryCode,
    row.creditLimit.toFixed(),
    row.paymentTerms,
    row.status as unknown as CustomerStatus,
    row.createdAt,
    row.updatedAt,
    row.createdBy,
    row.updatedBy,
    row.deletedAt,
  );
}

export class PrismaSalesRepository implements ISalesRepository {
  private client(tx?: RepositoryTransaction): PrismaTransactionClient | typeof prisma {
    return (tx as PrismaTransactionClient | undefined) ?? prisma;
  }

  // Customer is tenant-owned (06_DATABASE_STANDARDS.md MT-001) — every query
  // below asserts `tenantId` explicitly and independently, never trusting a
  // previously-resolved row (MT-002, Ch.6.4's worked example). `id` is never
  // accepted from outside this file (PK-003) — mutations key on
  // `(tenantId, uuid)`. `companyUuid` is a cross-module reference (FK-002) —
  // not validated for existence here (a future Business-layer concern,
  // mirroring Product's/Unit's own handling of `companyUuid`).

  async createCustomer(tenantId: bigint, props: CreateCustomerProps, tx?: RepositoryTransaction): Promise<Customer> {
    const row = await this.client(tx).customer.create({
      data: {
        uuid: newUuid(),
        tenantId,
        companyUuid: props.companyUuid,
        name: props.name,
        addressLine1: props.addressLine1 ?? null,
        addressLine2: props.addressLine2 ?? null,
        city: props.city ?? null,
        region: props.region ?? null,
        postalCode: props.postalCode ?? null,
        countryCode: props.countryCode ?? null,
        creditLimit: props.creditLimit ?? undefined,
        paymentTerms: props.paymentTerms ?? null,
        status: props.status ? (props.status as unknown as PrismaCustomerStatus) : undefined,
        createdBy: props.createdBy ?? null,
      },
    });
    return toCustomerDomain(row);
  }

  async updateCustomer(
    tenantId: bigint,
    uuid: string,
    props: UpdateCustomerProps,
    tx?: RepositoryTransaction,
  ): Promise<Customer> {
    const client = this.client(tx);
    const { count } = await client.customer.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: {
        name: props.name,
        addressLine1: props.addressLine1,
        addressLine2: props.addressLine2,
        city: props.city,
        region: props.region,
        postalCode: props.postalCode,
        countryCode: props.countryCode,
        creditLimit: props.creditLimit,
        paymentTerms: props.paymentTerms,
        status: props.status ? (props.status as unknown as PrismaCustomerStatus) : undefined,
        updatedBy: props.updatedBy ?? undefined,
      },
    });
    if (count === 0) {
      throw new CustomerNotFoundError(uuid);
    }
    const row = await client.customer.findFirst({ where: { tenantId, uuid } });
    return toCustomerDomain(row as CustomerModel);
  }

  async findCustomerByUuid(tenantId: bigint, uuid: string): Promise<Customer | null> {
    const row = await prisma.customer.findFirst({
      where: { tenantId, uuid, deletedAt: null },
    });
    return row ? toCustomerDomain(row) : null;
  }

  async findCustomerByName(tenantId: bigint, companyUuid: string, name: string): Promise<Customer | null> {
    const row = await prisma.customer.findFirst({
      where: { tenantId, companyUuid, name, deletedAt: null },
    });
    return row ? toCustomerDomain(row) : null;
  }

  async listCustomersByCompany(tenantId: bigint, companyUuid: string): Promise<Customer[]> {
    const rows = await prisma.customer.findMany({
      where: { tenantId, companyUuid, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return rows.map(toCustomerDomain);
  }

  async listCustomers(tenantId: bigint): Promise<Customer[]> {
    const rows = await prisma.customer.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return rows.map(toCustomerDomain);
  }
}
