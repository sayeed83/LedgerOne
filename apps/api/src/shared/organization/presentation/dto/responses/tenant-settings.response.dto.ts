import { z } from "zod";

export const tenantSettingsResponseSchema = z.object({
  uuid: z.string().uuid(),
  defaultCurrencyCode: z.string(),
  defaultTimeZone: z.string(),
  defaultFinancialYearPattern: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TenantSettingsResponse = z.infer<typeof tenantSettingsResponseSchema>;

/** Structural rather than importing the Domain `TenantSettings` type (Presentation must not import domain/, Ch.9.3). */
interface TenantSettingsLike {
  uuid: string;
  defaultCurrencyCode: string;
  defaultTimeZone: string;
  defaultFinancialYearPattern: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toTenantSettingsResponse(settings: TenantSettingsLike): TenantSettingsResponse {
  return {
    uuid: settings.uuid,
    defaultCurrencyCode: settings.defaultCurrencyCode,
    defaultTimeZone: settings.defaultTimeZone,
    defaultFinancialYearPattern: settings.defaultFinancialYearPattern,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
  };
}
