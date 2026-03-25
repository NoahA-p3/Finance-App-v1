"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CompanyRecord {
  id: string;
  name: string;
  vat_registered: boolean;
  contact_email: string | null;
  contact_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  city: string | null;
  country_code: string | null;
}

interface CompanySettingsRecord {
  company_id: string;
  base_currency: string;
  fiscal_year_start_month: number;
  invoice_prefix: string | null;
  invoice_terms: string | null;
  invoice_due_days: number | null;
  logo_storage_path: string | null;
  logo_file_name: string | null;
  logo_content_type: string | null;
  logo_file_size_bytes: number | null;
  branch_label: string | null;
  department_label: string | null;
  cvr_number: string | null;
}

interface CompanyResponse {
  company: CompanyRecord | null;
  settings?: CompanySettingsRecord | null;
}

interface CompanyFormState {
  name: string;
  contact_email: string;
  contact_phone: string;
  address_line1: string;
  address_line2: string;
  postal_code: string;
  city: string;
  country_code: string;
  base_currency: string;
  fiscal_year_start_month: string;
  invoice_prefix: string;
  invoice_terms: string;
  invoice_due_days: string;
  logo_storage_path: string;
  logo_file_name: string;
  logo_content_type: string;
  logo_file_size_bytes: string;
  branch_label: string;
  department_label: string;
  cvr_number: string;
  vat_registered: boolean;
}

function toFormState(payload?: CompanyResponse | null): CompanyFormState {
  return {
    name: payload?.company?.name ?? "",
    contact_email: payload?.company?.contact_email ?? "",
    contact_phone: payload?.company?.contact_phone ?? "",
    address_line1: payload?.company?.address_line1 ?? "",
    address_line2: payload?.company?.address_line2 ?? "",
    postal_code: payload?.company?.postal_code ?? "",
    city: payload?.company?.city ?? "",
    country_code: payload?.company?.country_code ?? "DK",
    base_currency: payload?.settings?.base_currency ?? "DKK",
    fiscal_year_start_month: String(payload?.settings?.fiscal_year_start_month ?? 1),
    invoice_prefix: payload?.settings?.invoice_prefix ?? "",
    invoice_terms: payload?.settings?.invoice_terms ?? "",
    invoice_due_days: payload?.settings?.invoice_due_days ? String(payload.settings.invoice_due_days) : "",
    logo_storage_path: payload?.settings?.logo_storage_path ?? "",
    logo_file_name: payload?.settings?.logo_file_name ?? "",
    logo_content_type: payload?.settings?.logo_content_type ?? "",
    logo_file_size_bytes: payload?.settings?.logo_file_size_bytes ? String(payload.settings.logo_file_size_bytes) : "",
    branch_label: payload?.settings?.branch_label ?? "",
    department_label: payload?.settings?.department_label ?? "",
    cvr_number: payload?.settings?.cvr_number ?? "",
    vat_registered: payload?.company?.vat_registered ?? false
  };
}

export function CompanyProfileForm({ isOnboarding = false }: { isOnboarding?: boolean }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasCompany, setHasCompany] = useState(false);
  const [form, setForm] = useState<CompanyFormState>(toFormState());
  const [isCvrLookingUp, setIsCvrLookingUp] = useState(false);
  const [cvrMessage, setCvrMessage] = useState<string | null>(null);

  const title = useMemo(() => (isOnboarding ? "Business information" : "Company Profile"), [isOnboarding]);

  useEffect(() => {
    async function loadCompany() {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/companies", { method: "GET", cache: "no-store" });

      if (!response.ok) {
        setIsLoading(false);
        setError(response.status === 401 ? "Please sign in again." : "Unable to load company profile.");
        return;
      }

      const payload = (await response.json()) as CompanyResponse;
      setHasCompany(Boolean(payload.company));
      setForm(toFormState(payload));
      setIsLoading(false);
    }

    void loadCompany();
  }, []);

  function updateField<Key extends keyof CompanyFormState>(key: Key, value: CompanyFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    const payload = {
      name: form.name,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      address_line1: form.address_line1 || null,
      address_line2: form.address_line2 || null,
      postal_code: form.postal_code || null,
      city: form.city || null,
      country_code: form.country_code || null,
      base_currency: form.base_currency,
      fiscal_year_start_month: Number(form.fiscal_year_start_month),
      invoice_prefix: form.invoice_prefix || null,
      invoice_terms: form.invoice_terms || null,
      invoice_due_days: form.invoice_due_days ? Number(form.invoice_due_days) : null,
      logo_storage_path: form.logo_storage_path || null,
      logo_file_name: form.logo_file_name || null,
      logo_content_type: form.logo_content_type || null,
      logo_file_size_bytes: form.logo_file_size_bytes ? Number(form.logo_file_size_bytes) : null,
      branch_label: form.branch_label || null,
      department_label: form.department_label || null,
      cvr_number: form.cvr_number || null,
      vat_registered: form.vat_registered
    };

    const method = hasCompany ? "PATCH" : "POST";
    const response = await fetch("/api/companies", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const responseBody = (await response.json().catch(() => ({}))) as { error?: string; company?: CompanyRecord };

    if (!response.ok) {
      setIsSaving(false);
      setError(responseBody.error ?? "Unable to save company profile.");
      return;
    }

    setHasCompany(Boolean(responseBody.company));
    setIsSaving(false);
    setSuccess(hasCompany ? "Company profile updated." : "Company profile created.");

    if (isOnboarding) {
      router.push("/dashboard");
    }
  }

  async function handleCvrLookup() {
    if (!form.cvr_number || form.cvr_number.length !== 8) {
      setCvrMessage("Enter an 8-digit CVR number first.");
      return;
    }

    setIsCvrLookingUp(true);
    setCvrMessage(null);
    const response = await fetch(`/api/companies/cvr?cvr=${encodeURIComponent(form.cvr_number)}`, { method: "GET", cache: "no-store" });
    const body = (await response.json().catch(() => ({}))) as {
      lookup?: { status?: string; provider_available?: boolean; message?: string; company?: { name?: string } };
      error?: string;
    };

    if (!response.ok) {
      setIsCvrLookingUp(false);
      setCvrMessage(body.error ?? "CVR lookup failed.");
      return;
    }

    if (body.lookup?.status === "ok" && body.lookup.company?.name) {
      updateField("name", body.lookup.company.name);
      setCvrMessage("CVR lookup succeeded. Review and save to persist updates.");
    } else {
      setCvrMessage(body.lookup?.message ?? "Provider unavailable. Continue with manual company entry.");
    }

    setIsCvrLookingUp(false);
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-300">
        {isOnboarding
          ? "Create your company profile to start using persisted finance features."
          : "Update your saved company information and fiscal settings."}
      </p>

      {isLoading ? <p className="mt-4 text-sm text-slate-300">Loading company profile...</p> : null}
      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-emerald-300">{success}</p> : null}

      {!isLoading ? (
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <Input placeholder="Business name" value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
          <Input placeholder="Contact email" value={form.contact_email} onChange={(event) => updateField("contact_email", event.target.value)} />
          <Input placeholder="Contact phone" value={form.contact_phone} onChange={(event) => updateField("contact_phone", event.target.value)} />
          <Input placeholder="Address line 1" value={form.address_line1} onChange={(event) => updateField("address_line1", event.target.value)} />
          <Input placeholder="Address line 2" value={form.address_line2} onChange={(event) => updateField("address_line2", event.target.value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Postal code" value={form.postal_code} onChange={(event) => updateField("postal_code", event.target.value)} />
            <Input placeholder="City" value={form.city} onChange={(event) => updateField("city", event.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              placeholder="Country code"
              value={form.country_code}
              onChange={(event) => updateField("country_code", event.target.value.toUpperCase())}
              maxLength={2}
            />
            <Input
              placeholder="Currency"
              value={form.base_currency}
              onChange={(event) => updateField("base_currency", event.target.value.toUpperCase())}
              maxLength={3}
            />
            <Input
              type="number"
              min={1}
              max={12}
              placeholder="Fiscal month"
              value={form.fiscal_year_start_month}
              onChange={(event) => updateField("fiscal_year_start_month", event.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input placeholder="Invoice prefix" value={form.invoice_prefix} onChange={(event) => updateField("invoice_prefix", event.target.value)} />
            <Input placeholder="Invoice due days" type="number" min={1} max={365} value={form.invoice_due_days} onChange={(event) => updateField("invoice_due_days", event.target.value)} />
            <Input placeholder="CVR number (8 digits)" value={form.cvr_number} maxLength={8} onChange={(event) => updateField("cvr_number", event.target.value.replace(/\D/g, ""))} />
          </div>
          <Input placeholder="Invoice terms" value={form.invoice_terms} onChange={(event) => updateField("invoice_terms", event.target.value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Branch label (placeholder)" value={form.branch_label} onChange={(event) => updateField("branch_label", event.target.value)} />
            <Input placeholder="Department label (placeholder)" value={form.department_label} onChange={(event) => updateField("department_label", event.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Logo storage path metadata" value={form.logo_storage_path} onChange={(event) => updateField("logo_storage_path", event.target.value)} />
            <Input placeholder="Logo file name metadata" value={form.logo_file_name} onChange={(event) => updateField("logo_file_name", event.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Logo content type metadata" value={form.logo_content_type} onChange={(event) => updateField("logo_content_type", event.target.value)} />
            <Input
              placeholder="Logo file size bytes metadata"
              type="number"
              min={0}
              value={form.logo_file_size_bytes}
              onChange={(event) => updateField("logo_file_size_bytes", event.target.value)}
            />
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-indigo-100/80">CVR lookup adapter</p>
            <p className="mt-1 text-xs text-indigo-100/65">If no provider is configured, manual fallback remains available and safe.</p>
            <Button type="button" className="mt-3 w-full" onClick={() => void handleCvrLookup()} disabled={isCvrLookingUp}>
              {isCvrLookingUp ? "Looking up CVR..." : "Lookup CVR"}
            </Button>
            {cvrMessage ? <p className="mt-2 text-xs text-indigo-100/80">{cvrMessage}</p> : null}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              className="rounded"
              checked={form.vat_registered}
              onChange={(event) => updateField("vat_registered", event.target.checked)}
            />
            VAT registered
          </label>

          <Button className="w-full" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : hasCompany ? "Save changes" : isOnboarding ? "Create company" : "Save settings"}
          </Button>
        </form>
      ) : null}
    </Card>
  );
}
