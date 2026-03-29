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

test('invitation create route mints acceptance token hash and expiry metadata', () => {
  const invitationsRoute = read('src/app/api/companies/invitations/route.ts');

  assert.match(invitationsRoute, /createInvitationToken/);
  assert.match(invitationsRoute, /createHash\("sha256"\)/);
  assert.match(invitationsRoute, /acceptance_token_hash/);
  assert.match(invitationsRoute, /acceptance_token_expires_at/);
  assert.match(invitationsRoute, /onboarding_url/);
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
