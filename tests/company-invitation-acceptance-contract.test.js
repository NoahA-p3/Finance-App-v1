const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

test('acceptance API endpoint validates token input and maps idempotent acceptance statuses', () => {
  const acceptRoute = read('src/app/api/companies/invitations/accept/route.ts');

  assert.match(acceptRoute, /requireAuthenticatedApiUser/);
  assert.match(acceptRoute, /token must be a non-empty string\./);
  assert.match(acceptRoute, /rpc\("accept_company_invitation"/);
  assert.match(acceptRoute, /already_accepted/);
  assert.match(acceptRoute, /Invitation token has expired\./);
  assert.match(acceptRoute, /Invitation does not belong to the authenticated user\./);
  assert.match(acceptRoute, /Invitation is not pending/);
});

test('invitation create and resend flows use token minting + delivery adapter seams', () => {
  const invitationsRoute = read('src/app/api/companies/invitations/route.ts');
  const tokenUtils = read('src/lib/company-invitations/tokens.ts');
  const deliveryAdapter = read('src/lib/company-invitations/delivery-adapter.ts');
  const resendRoute = read('src/app/api/companies/invitations/[id]/resend/route.ts');
  const revokeRoute = read('src/app/api/companies/invitations/[id]/revoke/route.ts');

  assert.match(invitationsRoute, /createInvitationToken/);
  assert.match(invitationsRoute, /getInvitationDeliveryAdapter/);
  assert.match(tokenUtils, /createHash\("sha256"\)/);
  assert.match(invitationsRoute, /acceptance_token_hash/);
  assert.match(invitationsRoute, /acceptance_token_expires_at/);
  assert.match(deliveryAdapter, /onboarding_url/);
  assert.match(resendRoute, /Invitation cannot be resent when status is/);
  assert.match(revokeRoute, /Invitation cannot be revoked when status is/);
});

test('migration enforces token-based acceptance with expiry and cross-tenant email checks', () => {
  const migration = read('supabase/migrations/202603290001_company_invitation_acceptance_flow.sql');

  assert.match(migration, /acceptance_token_hash text/);
  assert.match(migration, /acceptance_token_expires_at timestamptz/);
  assert.match(migration, /accepted_at timestamptz/);
  assert.match(migration, /accepted_by uuid references auth\.users/);
  assert.match(migration, /create or replace function public\.accept_company_invitation/);
  assert.match(migration, /v_invitation\.acceptance_token_expires_at <= now\(\)/);
  assert.match(migration, /lower\(v_invitation\.invited_email\) <> v_user_email/);
  assert.match(migration, /result = 'already_accepted'|already_accepted/);
});
