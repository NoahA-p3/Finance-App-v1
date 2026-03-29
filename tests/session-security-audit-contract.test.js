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

test('session events emitter writes to Supabase-backed security session events sink', () => {
  const sessionEventsLib = read('src/lib/session-events.ts');

  assert.doesNotMatch(sessionEventsLib, /noopSessionAuditSink/);
  assert.match(sessionEventsLib, /createSupabaseSessionAuditSink/);
  assert.match(sessionEventsLib, /from\("security_session_events"\)\.insert/);
  assert.match(sessionEventsLib, /event_type: "session\.revoked"/);
  assert.match(sessionEventsLib, /throw new Error\(error\.message\)/);
});
