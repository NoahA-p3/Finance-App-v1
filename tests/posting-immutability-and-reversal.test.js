const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

test('posting migration enforces append-only audit events and blocks destructive edits for posted records', () => {
  const migration = read('supabase/migrations/202603270002_posting_and_audit_immutability.sql');
  const [activeMigration] = migration.split('-- Rollback / recovery notes:');

  assert.match(activeMigration, /create table if not exists public\.audit_events/);
  assert.match(activeMigration, /create or replace function public\.prevent_audit_event_mutation\(\)/);
  assert.match(activeMigration, /create trigger prevent_audit_event_update/);
  assert.match(activeMigration, /create trigger prevent_audit_event_delete/);

  assert.match(activeMigration, /create or replace function public\.prevent_posted_transaction_mutation\(\)/);
  assert.match(activeMigration, /create trigger prevent_posted_transaction_update/);
  assert.match(activeMigration, /create trigger prevent_posted_transaction_delete/);

  assert.match(activeMigration, /create or replace function public\.prevent_finalized_journal_mutation\(\)/);
  assert.match(activeMigration, /create trigger prevent_finalized_journal_update/);
  assert.match(activeMigration, /create trigger prevent_finalized_journal_delete/);
});

test('posting service + endpoints provide reversal traceability contract', () => {
  const service = read('src/lib/postings/service.ts');
  const postingsRoute = read('src/app/api/postings/route.ts');
  const reverseRoute = read('src/app/api/postings/[posting_id]/reverse/route.ts');

  assert.match(service, /"posting\.posted"/);
  assert.match(service, /"posting\.reversed"/);
  assert.match(service, /reversal_of_journal_entry_id/);
  assert.match(service, /status: "reversed"/);
  assert.match(service, /assertNoPeriodLock/);

  assert.match(postingsRoute, /createPostingForTransaction/);
  assert.match(reverseRoute, /reversePosting/);
  assert.match(reverseRoute, /reason is required/);
});
