import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import { COMPANY_PERMISSIONS, getCompanyMembershipContext, hasCompanyPermission } from "@/lib/company-permissions";

const ISO_CURRENCY_PATTERN = /^[A-Z]{3}$/;
const ISO_COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

interface CompanyWritePayload {
  name?: string;
  vat_registered?: boolean;
  contact_email?: string | null;
  contact_phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country_code?: string | null;
  base_currency?: string;
  fiscal_year_start_month?: number;
}

function normalizeOptionalText(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateCompanyPayload(payload: unknown, mode: "create" | "update"): { value?: CompanyWritePayload; error?: string } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "Request body must be a JSON object." };
  }

  const raw = payload as Record<string, unknown>;
  const nextPayload: CompanyWritePayload = {};

  if (mode === "create" || "name" in raw) {
    if (typeof raw.name !== "string" || raw.name.trim().length === 0) {
      return { error: "name is required." };
    }

    nextPayload.name = raw.name.trim();
  }

  if ("vat_registered" in raw) {
    if (typeof raw.vat_registered !== "boolean") {
      return { error: "vat_registered must be a boolean." };
    }

    nextPayload.vat_registered = raw.vat_registered;
  }

  const contactEmail = normalizeOptionalText(raw.contact_email);
  if ("contact_email" in raw) {
    if (contactEmail !== null && contactEmail !== undefined && !contactEmail.includes("@")) {
      return { error: "contact_email must be a valid email format." };
    }

    nextPayload.contact_email = contactEmail;
  }

  if ("contact_phone" in raw) nextPayload.contact_phone = normalizeOptionalText(raw.contact_phone);
  if ("address_line1" in raw) nextPayload.address_line1 = normalizeOptionalText(raw.address_line1);
  if ("address_line2" in raw) nextPayload.address_line2 = normalizeOptionalText(raw.address_line2);
  if ("postal_code" in raw) nextPayload.postal_code = normalizeOptionalText(raw.postal_code);
  if ("city" in raw) nextPayload.city = normalizeOptionalText(raw.city);

  if ("country_code" in raw) {
    const countryCode = normalizeOptionalText(raw.country_code);

    if (countryCode !== null && countryCode !== undefined && !ISO_COUNTRY_CODE_PATTERN.test(countryCode.toUpperCase())) {
      return { error: "country_code must be a 2-letter ISO country code." };
    }

    nextPayload.country_code = countryCode ? countryCode.toUpperCase() : countryCode;
  }

  if (mode === "create" || "base_currency" in raw) {
    const baseCurrencyRaw = normalizeOptionalText(raw.base_currency);
    const baseCurrency = (baseCurrencyRaw ?? "DKK").toUpperCase();

    if (!ISO_CURRENCY_PATTERN.test(baseCurrency)) {
      return { error: "base_currency must be a 3-letter ISO currency code." };
    }

    nextPayload.base_currency = baseCurrency;
  }

  if (mode === "create" || "fiscal_year_start_month" in raw) {
    const month = raw.fiscal_year_start_month ?? 1;

    if (typeof month !== "number" || !Number.isInteger(month) || month < 1 || month > 12) {
      return { error: "fiscal_year_start_month must be an integer between 1 and 12." };
    }

    nextPayload.fiscal_year_start_month = month;
  }

  if (mode === "update" && Object.keys(nextPayload).length === 0) {
    return { error: "At least one editable field is required." };
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
    return NextResponse.json({ company: null, membership: null });
  }

  const [{ data: company, error: companyError }, { data: settings, error: settingsError }] = await Promise.all([
    authContext.supabase.from("companies").select("*").eq("id", membership.companyId).single(),
    authContext.supabase.from("company_settings").select("*").eq("company_id", membership.companyId).maybeSingle()
  ]);

  if (companyError) {
    return NextResponse.json({ error: companyError.message }, { status: 400 });
  }

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 400 });
  }

  return NextResponse.json({ company, settings, membership: { company_id: membership.companyId, role: membership.role } });
}

export async function POST(req: NextRequest) {
  const authContext = await requireAuthenticatedApiUser();

  if (!authContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingMembership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);

  if (existingMembership) {
    return NextResponse.json({ error: "Company already exists for this user." }, { status: 409 });
  }

  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validateCompanyPayload(payload, "create");

  if (!validation.value) {
    return NextResponse.json({ error: validation.error ?? "Invalid request body." }, { status: 400 });
  }

  const { data: company, error: companyError } = await authContext.supabase
    .from("companies")
    .insert({
      created_by: authContext.user.id,
      name: validation.value.name,
      vat_registered: validation.value.vat_registered ?? false,
      contact_email: validation.value.contact_email ?? null,
      contact_phone: validation.value.contact_phone ?? null,
      address_line1: validation.value.address_line1 ?? null,
      address_line2: validation.value.address_line2 ?? null,
      postal_code: validation.value.postal_code ?? null,
      city: validation.value.city ?? null,
      country_code: validation.value.country_code ?? null
    })
    .select("*")
    .single();

  if (companyError) {
    return NextResponse.json({ error: companyError.message }, { status: 400 });
  }

  const { error: membershipInsertError } = await authContext.supabase.from("company_memberships").insert({
    company_id: company.id,
    user_id: authContext.user.id,
    role: "owner"
  });

  if (membershipInsertError) {
    return NextResponse.json({ error: membershipInsertError.message }, { status: 400 });
  }

  const { data: settings, error: settingsError } = await authContext.supabase
    .from("company_settings")
    .insert({
      company_id: company.id,
      base_currency: validation.value.base_currency ?? "DKK",
      fiscal_year_start_month: validation.value.fiscal_year_start_month ?? 1
    })
    .select("*")
    .single();

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 400 });
  }

  return NextResponse.json(
    {
      company,
      settings,
      membership: { company_id: company.id, role: "owner" }
    },
    { status: 201 }
  );
}

export async function PATCH(req: NextRequest) {
  const authContext = await requireAuthenticatedApiUser();

  if (!authContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);

  if (!membership) {
    return NextResponse.json({ error: "No company membership found." }, { status: 404 });
  }

  if (!hasCompanyPermission(membership, COMPANY_PERMISSIONS.SETTINGS_MANAGE)) {
    return NextResponse.json({ error: "Missing required permission: company.settings.manage" }, { status: 403 });
  }

  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validateCompanyPayload(payload, "update");

  if (!validation.value) {
    return NextResponse.json({ error: validation.error ?? "Invalid request body." }, { status: 400 });
  }

  const companyUpdates: Record<string, unknown> = {};

  const companyFields: Array<keyof CompanyWritePayload> = [
    "name",
    "vat_registered",
    "contact_email",
    "contact_phone",
    "address_line1",
    "address_line2",
    "postal_code",
    "city",
    "country_code"
  ];

  for (const field of companyFields) {
    if (field in validation.value) {
      companyUpdates[field] = validation.value[field] ?? null;
    }
  }

  let companyResult: { [key: string]: unknown } | null = null;
  let settingsResult: { [key: string]: unknown } | null = null;

  if (Object.keys(companyUpdates).length > 0) {
    const { data: updatedCompany, error: companyError } = await authContext.supabase
      .from("companies")
      .update(companyUpdates)
      .eq("id", membership.companyId)
      .select("*")
      .single();

    if (companyError) {
      return NextResponse.json({ error: companyError.message }, { status: 400 });
    }

    companyResult = updatedCompany;
  }

  const settingsUpdates: Record<string, unknown> = {};

  if ("base_currency" in validation.value) {
    settingsUpdates.base_currency = validation.value.base_currency;
  }

  if ("fiscal_year_start_month" in validation.value) {
    settingsUpdates.fiscal_year_start_month = validation.value.fiscal_year_start_month;
  }

  if (Object.keys(settingsUpdates).length > 0) {
    const { data: updatedSettings, error: settingsError } = await authContext.supabase
      .from("company_settings")
      .upsert({ company_id: membership.companyId, ...settingsUpdates }, { onConflict: "company_id" })
      .select("*")
      .single();

    if (settingsError) {
      return NextResponse.json({ error: settingsError.message }, { status: 400 });
    }

    settingsResult = updatedSettings;
  }

  if (!companyResult || !settingsResult) {
    const [{ data: currentCompany, error: currentCompanyError }, { data: currentSettings, error: currentSettingsError }] = await Promise.all([
      authContext.supabase.from("companies").select("*").eq("id", membership.companyId).single(),
      authContext.supabase.from("company_settings").select("*").eq("company_id", membership.companyId).maybeSingle()
    ]);

    if (currentCompanyError) {
      return NextResponse.json({ error: currentCompanyError.message }, { status: 400 });
    }

    if (currentSettingsError) {
      return NextResponse.json({ error: currentSettingsError.message }, { status: 400 });
    }

    companyResult = currentCompany;
    settingsResult = currentSettings;
  }

  return NextResponse.json({ company: companyResult, settings: settingsResult, membership: { company_id: membership.companyId, role: membership.role } });
}
