import { CustomerStatus } from "../enums/customer-status.enum";

// Domain entity for a Customer (00_BUSINESS_RULES.md Ch.45) — the
// Sales-context identity of a party a Company sells to: name, billing/
// shipping address, credit limit, payment terms, and Prospect/Active/
// OnHold/Inactive lifecycle (Ch.45.5). Tenant-owned
// (06_DATABASE_STANDARDS.md MT-001), carrying `companyUuid` directly
// (cross-module reference, FK-002, no DB-level FK), mirroring Product's own
// ownership shape. Data shape only — no lifecycle transition methods, no
// credit-limit/outstanding-balance validation (CUS-002), no Business
// Location (Ch.9) or Price List (Ch.46) integration; all Business-layer
// concerns for a later milestone.
//
// `creditLimit` is a DECIMAL(20,4) column (sales.prisma) mapped to a plain
// fixed-point string, mirroring Reorder Level's own quantity-field mapping
// — a cross-module Domain import of a shared `DecimalValue` type is
// architecturally forbidden at this layer (see unit.entity.ts's own header
// comment, inventory module).
export class Customer {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly companyUuid: string,
    public readonly name: string,
    public readonly addressLine1: string | null,
    public readonly addressLine2: string | null,
    public readonly city: string | null,
    public readonly region: string | null,
    public readonly postalCode: string | null,
    public readonly countryCode: string | null,
    public readonly creditLimit: string,
    public readonly paymentTerms: string | null,
    public readonly status: CustomerStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}
}

/** Fields required to persist a new Customer row; identity/timestamps are assigned by the database. */
export interface CreateCustomerProps {
  companyUuid: string;
  name: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  creditLimit?: string;
  paymentTerms?: string | null;
  status?: CustomerStatus;
  createdBy?: bigint | null;
}

/** Fields a caller may revise on an existing Customer row. */
export interface UpdateCustomerProps {
  name?: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  creditLimit?: string;
  paymentTerms?: string | null;
  status?: CustomerStatus;
  updatedBy?: bigint | null;
}
