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
