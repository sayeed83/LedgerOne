// Mirrors apps/api/src/shared/sales/presentation/dto/responses/customer.response.dto.ts
// and dto/requests/{create-customer.dto.ts,update-customer.dto.ts}.
export enum CustomerStatus {
  Prospect = "PROSPECT",
  Active = "ACTIVE",
  OnHold = "ON_HOLD",
  Inactive = "INACTIVE",
}

export interface CustomerResponseDto {
  uuid: string;
  companyUuid: string;
  name: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  countryCode: string | null;
  creditLimit: string;
  paymentTerms: string | null;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequestDto {
  companyUuid: string;
  name: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  countryCode?: string;
  creditLimit?: string;
  paymentTerms?: string;
  status?: CustomerStatus;
}

// Mirrors the backend's own `update-customer.dto.ts` exactly — no
// `companyUuid` field, since Ch.45 documents no Customer-reassigned-to-a-
// different-Company workflow and it is not an updatable field on the
// backend's own contract.
export interface UpdateCustomerRequestDto {
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
}
