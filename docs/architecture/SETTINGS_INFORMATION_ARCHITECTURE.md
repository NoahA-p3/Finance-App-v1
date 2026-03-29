# Settings Information Architecture (March 27, 2026)

## Intent
Settings is for configuration and defaults only. Operational workflows (e.g., transactions, receipts, reporting, onboarding, support) stay in their product areas and are not re-homed into Settings.

## Top-level tabs
The Settings area now uses these top-level sections:

1. **Personal** — user-specific profile/security/session preferences.
2. **Company** — company identity, VAT status, fiscal defaults, branding metadata, and plan/entitlements visibility.
3. **Team & Access** — membership and permission configuration surfaces.
4. **Sales & Documents** — commercial document defaults (invoice numbering/terms/templates/reminders).
5. **Accounting & Tax** — accounting policy and VAT/tax configuration surfaces.
6. **Banking & Payments** — bank/payment connectivity and sync status surfaces.
7. **Integrations** — third-party app connections and integration diagnostics.

Optional tabs (Automation, Payroll, Developer, Security & Audit) should only be exposed when backed by implemented, non-trivial features.
In the current implementation they are feature-gated and enabled by default (set a flag to `false` to hide):
- `NEXT_PUBLIC_ENABLE_SETTINGS_AUTOMATION`
- `NEXT_PUBLIC_ENABLE_SETTINGS_PAYROLL`
- `NEXT_PUBLIC_ENABLE_SETTINGS_DEVELOPER`
- `NEXT_PUBLIC_ENABLE_SETTINGS_SECURITY_AUDIT`

## Routing
- Settings landing page: `/settings`
- Tab routes: `/settings/<tab-key>`
- Legacy account route compatibility: `/account` now redirects to `/settings/personal`

## Current implementation notes
- Existing forms were reused to avoid disrupting persisted models and APIs.
- `CompanyProfileForm` still contains some fields that logically belong to Sales & Documents or Accounting & Tax; these are intentionally staged for incremental extraction into dedicated tab-specific forms.
- Placeholder pages are intentionally explicit where structure exists but full implementation is pending.

## Settings tab readiness matrix
**As of:** 2026-03-29.

| Tab key | Status | Persisted models used | API routes used | Known placeholders / TODOs |
|---|---|---|---|---|
| `personal` | implemented | `public.profiles`, authenticated session metadata | `/api/me/account`, `/api/me/devices`, `/api/me/login-alerts`, `/api/me/mfa/*`, `/api/me/sessions` | No dedicated outbound notification channel for login alerts in MVP. |
| `company` | implemented | `public.company_settings`, `public.companies`, `public.profiles.active_company_id`, internal billing models (`public.plans`, `public.subscriptions`, `public.plan_entitlements`) when entitlements are enabled | `/api/companies`, `/api/companies/switch`, `/api/entitlements` | Branding and branch/department fields still include placeholder metadata scaffolding. |
| `team-access` | implemented | `public.company_memberships`, `public.company_invitations`, `public.roles`, `public.role_permissions` | `/api/companies/members`, `/api/companies/invitations`, `/api/companies/invitations/accept` | Advanced role workflows are intentionally limited in MVP. |
| `sales-documents` | partial | Reuses `public.company_settings` invoice-default fields (prefix/terms/default due days) | `/api/companies` (settings persistence currently shared with Company tab) | Dedicated Sales & Documents forms/pages are pending extraction. |
| `accounting-tax` | partial | Reuses `public.company_settings` fiscal/VAT defaults | `/api/companies` (settings persistence currently shared with Company tab) | VAT engine, tax-rule automation, VAT code mappings, and filing setup are planned. |
| `banking-payments` | planned | None yet | None yet | Bank connections, mapping, sync status, and provider setup are placeholders. |
| `integrations` | planned | None yet | None yet (outside Settings, CVR lookup exists at `/api/companies/cvr`) | Connect/disconnect, sync health, retry, and mapping controls are placeholders. |
| `automation` | planned | None yet | None yet | Feature-gated placeholder tab (`NEXT_PUBLIC_ENABLE_SETTINGS_AUTOMATION`) with no persisted rule model yet. |
| `payroll` | planned | None yet | None yet | Feature-gated placeholder tab (`NEXT_PUBLIC_ENABLE_SETTINGS_PAYROLL`); payroll model/flows are not implemented. |
| `developer` | planned | None yet | None yet | Feature-gated placeholder tab (`NEXT_PUBLIC_ENABLE_SETTINGS_DEVELOPER`); API key/OAuth/webhook settings are not implemented. |
| `security-audit` | planned | None yet | None yet | Feature-gated placeholder tab (`NEXT_PUBLIC_ENABLE_SETTINGS_SECURITY_AUDIT`); workspace-level security/audit controls are not implemented. |
