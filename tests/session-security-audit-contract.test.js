const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

test('security session migration creates append-only user-scoped audit table', () => {
  const migration = read('supabase/migrations/202603290001_security_session_events.sql');
  const [activeMigration] = migration.split('-- Rollback / recovery notes:');

  assert.match(activeMigration, /create table if not exists public\.security_session_events/);
  assert.match(activeMigration, /actor_user_id uuid not null references auth\.users\(id\)/);
  assert.match(activeMigration, /target_session_id uuid not null/);
  assert.match(activeMigration, /constraint security_session_events_event_type_check check \(event_type in \('session\.revoked'\)\)/);
  assert.match(activeMigration, /create trigger prevent_security_session_event_update/);
  assert.match(activeMigration, /create trigger prevent_security_session_event_delete/);
  assert.match(activeMigration, /create policy "Users insert own security session events"/);
  assert.match(activeMigration, /with check \(actor_user_id = auth\.uid\(\)\)/);
});

test('retry queue migration creates append-only durable replay tables with idempotency key support', () => {
  const migration = read('supabase/migrations/202603290003_security_event_retry_queue.sql');
  const [activeMigration] = migration.split('-- Rollback / recovery notes:');

  assert.match(activeMigration, /alter table public\.security_session_events\s+add column if not exists idempotency_key text;/);
  assert.match(activeMigration, /create unique index if not exists security_session_events_idempotency_key_uidx/);
  assert.match(activeMigration, /create table if not exists public\.security_event_retry_queue/);
  assert.match(activeMigration, /constraint security_event_retry_queue_idempotency_key_key unique \(idempotency_key\)/);
  assert.match(activeMigration, /create table if not exists public\.security_event_retry_attempts/);
  assert.match(activeMigration, /delivery_status in \('delivered', 'retryable_failure', 'permanent_failure'\)/);
  assert.match(activeMigration, /create trigger prevent_security_event_retry_queue_update/);
  assert.match(activeMigration, /create trigger prevent_security_event_retry_attempt_delete/);
});

test('session events emitter writes Supabase audit events and durable retry queue rows', () => {
  const sessionEventsLib = read('src/lib/session-events.ts');

  assert.match(sessionEventsLib, /createSupabaseSessionAuditSink/);
  assert.match(sessionEventsLib, /from\("security_session_events"\)\.insert/);
  assert.match(sessionEventsLib, /idempotency_key: getSessionRevocationIdempotencyKey\(event\)/);
  assert.match(sessionEventsLib, /enqueueSessionRevokedEventRetry/);
  assert.match(sessionEventsLib, /from\("security_event_retry_queue"\)\.insert/);
});

test('session revoke route enqueues durable retry rows when audit insert fails', () => {
  const sessionRevokeRoute = read('src/app/api/me/sessions/[session_id]/route.ts');

  assert.match(sessionRevokeRoute, /try \{\s*await emitSessionRevokedEvent/s);
  assert.match(sessionRevokeRoute, /catch \(error\)/);
  assert.match(sessionRevokeRoute, /console\.error\("session_revocation_audit_write_failed"/);
  assert.match(sessionRevokeRoute, /await enqueueSessionRevokedEventRetry\(authContext\.supabase/);
  assert.match(sessionRevokeRoute, /console\.error\("session_revocation_audit_retry_enqueue_failed"/);
  assert.match(sessionRevokeRoute, /return NextResponse\.json\(\{ success: true \}, \{ status: 200 \}\);/);
});
