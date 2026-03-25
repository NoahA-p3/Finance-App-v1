export interface CvrCompanySnapshot {
  cvr_number: string;
  name: string;
  address_line1?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country_code?: string | null;
  vat_registered?: boolean | null;
}

export interface CvrLookupResult {
  status: "ok" | "unavailable" | "not_found";
  provider: string;
  provider_available: boolean;
  manual_entry_required: boolean;
  company?: CvrCompanySnapshot;
  message?: string;
}

export interface CvrLookupAdapter {
  lookupByCvr(cvrNumber: string): Promise<CvrLookupResult>;
}

class UnconfiguredCvrAdapter implements CvrLookupAdapter {
  async lookupByCvr(cvrNumber: string): Promise<CvrLookupResult> {
    return {
      status: "unavailable",
      provider: "not_configured",
      provider_available: false,
      manual_entry_required: true,
      message: `CVR provider integration is not configured. Continue with manual company entry for CVR ${cvrNumber}.`
    };
  }
}

export function getCvrLookupAdapter(): CvrLookupAdapter {
  return new UnconfiguredCvrAdapter();
}
