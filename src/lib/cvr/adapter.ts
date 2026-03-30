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

const ENV_PROVIDER = "CVR_LOOKUP_PROVIDER";
const ENV_BASE_URL = "CVR_LOOKUP_BASE_URL";
const ENV_API_KEY = "CVR_LOOKUP_API_KEY";
const ENV_TIMEOUT_MS = "CVR_LOOKUP_TIMEOUT_MS";

const DEFAULT_TIMEOUT_MS = 2500;

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

interface HttpCvrProviderConfig {
  provider: string;
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
}

interface HttpCvrCompanyPayload {
  cvr_number?: unknown;
  name?: unknown;
  address_line1?: unknown;
  postal_code?: unknown;
  city?: unknown;
  country_code?: unknown;
  vat_registered?: unknown;
}

class HttpJsonCvrAdapter implements CvrLookupAdapter {
  constructor(private readonly config: HttpCvrProviderConfig) {}

  async lookupByCvr(cvrNumber: string): Promise<CvrLookupResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(`${this.config.baseUrl}/cvr/${encodeURIComponent(cvrNumber)}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.config.apiKey}`
        },
        signal: controller.signal,
        cache: "no-store"
      });

      if (response.status === 404) {
        return {
          status: "not_found",
          provider: this.config.provider,
          provider_available: true,
          manual_entry_required: true,
          message: `No CVR company match found for ${cvrNumber}. Continue with manual company entry.`
        };
      }

      if (!response.ok) {
        return this.unavailable("CVR lookup is temporarily unavailable. Continue with manual company entry.");
      }

      const payload = (await response.json()) as HttpCvrCompanyPayload;
      const company = mapPayloadToCompany(payload, cvrNumber);

      if (!company) {
        return this.unavailable("CVR lookup returned invalid provider data. Continue with manual company entry.");
      }

      return {
        status: "ok",
        provider: this.config.provider,
        provider_available: true,
        manual_entry_required: false,
        company
      };
    } catch {
      return this.unavailable("CVR provider did not respond in time. Continue with manual company entry.");
    } finally {
      clearTimeout(timeout);
    }
  }

  private unavailable(message: string): CvrLookupResult {
    return {
      status: "unavailable",
      provider: this.config.provider,
      provider_available: false,
      manual_entry_required: true,
      message
    };
  }
}

function mapPayloadToCompany(payload: HttpCvrCompanyPayload, requestedCvrNumber: string): CvrCompanySnapshot | null {
  if (typeof payload.name !== "string" || payload.name.trim().length === 0) {
    return null;
  }

  const cvrNumber = typeof payload.cvr_number === "string" && payload.cvr_number.trim().length > 0
    ? payload.cvr_number.trim()
    : requestedCvrNumber;

  return {
    cvr_number: cvrNumber,
    name: payload.name.trim(),
    address_line1: typeof payload.address_line1 === "string" ? payload.address_line1.trim() : null,
    postal_code: typeof payload.postal_code === "string" ? payload.postal_code.trim() : null,
    city: typeof payload.city === "string" ? payload.city.trim() : null,
    country_code: typeof payload.country_code === "string" ? payload.country_code.trim().toUpperCase() : null,
    vat_registered: typeof payload.vat_registered === "boolean" ? payload.vat_registered : null
  };
}

function parseTimeoutMs(raw: string | undefined): number {
  if (!raw) {
    return DEFAULT_TIMEOUT_MS;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }

  return parsed;
}

function readHttpProviderConfigFromEnv(): HttpCvrProviderConfig | null {
  const provider = process.env[ENV_PROVIDER]?.trim();
  const baseUrl = process.env[ENV_BASE_URL]?.trim();
  const apiKey = process.env[ENV_API_KEY]?.trim();

  if (!provider || !baseUrl || !apiKey) {
    return null;
  }

  if (provider !== "http_json") {
    return null;
  }

  return {
    provider,
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey,
    timeoutMs: parseTimeoutMs(process.env[ENV_TIMEOUT_MS])
  };
}

export function getCvrLookupAdapter(): CvrLookupAdapter {
  const config = readHttpProviderConfigFromEnv();
  if (!config) {
    return new UnconfiguredCvrAdapter();
  }

  return new HttpJsonCvrAdapter(config);
}
