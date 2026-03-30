import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import { COMPANY_PERMISSIONS, getCompanyMembershipContext, hasCompanyPermission } from "@/lib/company-permissions";

type IntegrationStatus = "disconnected" | "connected" | "error";

interface IntegrationWritePayload {
  provider_key: string;
  display_name?: string | null;
  status?: IntegrationStatus;
  config?: Record<string, unknown>;
  last_synced_at?: string | null;
  last_error_message?: string | null;
}

const INTEGRATION_STATUS_VALUES: IntegrationStatus[] = ["disconnected", "connected", "error"];
const PROVIDER_KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{1,62}[a-z0-9]$/;

function normalizeOptionalText(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validatePayload(payload: unknown): { value?: IntegrationWritePayload; error?: string } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "Request body must be a JSON object." };
  }

  const raw = payload as Record<string, unknown>;
  const providerKeyRaw = normalizeOptionalText(raw.provider_key);

  if (!providerKeyRaw || !PROVIDER_KEY_PATTERN.test(providerKeyRaw)) {
    return {
      error:
        "provider_key is required and must use lowercase letters, digits, underscores, or hyphens (3-64 chars)."
    };
  }

  const nextPayload: IntegrationWritePayload = {
    provider_key: providerKeyRaw
  };

  if ("display_name" in raw) {
    nextPayload.display_name = normalizeOptionalText(raw.display_name);
  }

  if ("status" in raw) {
    if (typeof raw.status !== "string" || !INTEGRATION_STATUS_VALUES.includes(raw.status as IntegrationStatus)) {
      return { error: "status must be one of: disconnected, connected, error." };
    }

    nextPayload.status = raw.status as IntegrationStatus;
  }

  if ("config" in raw) {
    if (!raw.config || typeof raw.config !== "object" || Array.isArray(raw.config)) {
      return { error: "config must be a JSON object when provided." };
    }

    nextPayload.config = raw.config as Record<string, unknown>;
  }

  if ("last_synced_at" in raw) {
    if (raw.last_synced_at === null) {
      nextPayload.last_synced_at = null;
    } else if (typeof raw.last_synced_at === "string") {
      const timestamp = Date.parse(raw.last_synced_at);
      if (Number.isNaN(timestamp)) {
        return { error: "last_synced_at must be null or an ISO-8601 timestamp string." };
      }

      nextPayload.last_synced_at = new Date(timestamp).toISOString();
    } else {
      return { error: "last_synced_at must be null or an ISO-8601 timestamp string." };
    }
  }

  if ("last_error_message" in raw) {
    nextPayload.last_error_message = normalizeOptionalText(raw.last_error_message);
  }

  return { value: nextPayload };
}

export async function GET() {
  const authContext = await requireAuthenticatedApiUser();

  if (!authContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);

  if (!membership) {
    return NextResponse.json({ integrations: [] });
  }

  if (!hasCompanyPermission(membership, COMPANY_PERMISSIONS.SETTINGS_MANAGE)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await authContext.supabase
    .from("integration_connections")
    .select("id, provider_key, display_name, status, config, last_synced_at, last_error_message, created_at, updated_at")
    .eq("company_id", membership.companyId)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ integrations: data ?? [] });
}

export async function POST(req: NextRequest) {
  const authContext = await requireAuthenticatedApiUser();

  if (!authContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);

  if (!membership) {
    return NextResponse.json({ error: "Company membership required." }, { status: 403 });
  }

  if (!hasCompanyPermission(membership, COMPANY_PERMISSIONS.SETTINGS_MANAGE)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validatePayload(payload);

  if (!validation.value) {
    return NextResponse.json({ error: validation.error ?? "Invalid request body." }, { status: 400 });
  }

  const writePayload = {
    company_id: membership.companyId,
    provider_key: validation.value.provider_key,
    display_name: validation.value.display_name ?? null,
    status: validation.value.status ?? "disconnected",
    config: validation.value.config ?? {},
    last_synced_at: validation.value.last_synced_at ?? null,
    last_error_message: validation.value.last_error_message ?? null,
    created_by: authContext.user.id
  };

  const { data, error } = await authContext.supabase
    .from("integration_connections")
    .upsert(writePayload, { onConflict: "company_id,provider_key" })
    .select("id, provider_key, display_name, status, config, last_synced_at, last_error_message, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ integration: data }, { status: 201 });
}
