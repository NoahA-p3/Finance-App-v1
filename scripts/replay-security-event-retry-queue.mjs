#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const requiredEnv = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const dryRun = process.argv.includes('--dry-run');
const limit = limitArg ? Number.parseInt(limitArg.split('=')[1], 10) : 100;

if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
  console.error('Invalid --limit value. Expected integer between 1 and 1000.');
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const { data: queuedRows, error: queueError } = await supabase
  .from('security_event_retry_queue')
  .select('id,idempotency_key,actor_user_id,target_session_id,event_type,occurred_at,metadata,enqueued_at')
  .order('enqueued_at', { ascending: true })
  .limit(limit);

if (queueError) {
  console.error('Failed to load retry queue rows.', queueError.message);
  process.exit(1);
}

if (!queuedRows?.length) {
  console.log('No queued security events to replay.');
  process.exit(0);
}

const queueIds = queuedRows.map((row) => row.id);
const { data: attemptRows, error: attemptsError } = await supabase
  .from('security_event_retry_attempts')
  .select('queue_id,delivery_status')
  .in('queue_id', queueIds);

if (attemptsError) {
  console.error('Failed to load retry attempt rows.', attemptsError.message);
  process.exit(1);
}

const deliveredQueueIds = new Set(
  (attemptRows ?? []).filter((row) => row.delivery_status === 'delivered').map((row) => row.queue_id)
);

const pendingRows = queuedRows.filter((row) => !deliveredQueueIds.has(row.id));

if (!pendingRows.length) {
  console.log('All queued rows in selected window are already delivered.');
  process.exit(0);
}

const workerId = process.env.HOSTNAME || 'security-replay-worker';
let delivered = 0;
let skipped = 0;
let failed = 0;

for (const row of pendingRows) {
  if (dryRun) {
    skipped += 1;
    continue;
  }

  const { data: insertedEvent, error: insertError } = await supabase
    .from('security_session_events')
    .insert({
      actor_user_id: row.actor_user_id,
      target_session_id: row.target_session_id,
      event_type: row.event_type,
      occurred_at: row.occurred_at,
      metadata: row.metadata,
      idempotency_key: row.idempotency_key
    })
    .select('id')
    .single();

  const isConflict = Boolean(insertError?.message?.toLowerCase().includes('duplicate key value'));

  if (insertError && !isConflict) {
    failed += 1;
    const { error: attemptError } = await supabase.from('security_event_retry_attempts').insert({
      queue_id: row.id,
      idempotency_key: row.idempotency_key,
      worker_id: workerId,
      delivery_status: 'retryable_failure',
      error_code: 'insert_failed',
      error_message: insertError.message.slice(0, 240)
    });

    if (attemptError) {
      console.error('Failed to record retry failure attempt.', attemptError.message);
    }

    continue;
  }

  const { error: attemptError } = await supabase.from('security_event_retry_attempts').insert({
    queue_id: row.id,
    idempotency_key: row.idempotency_key,
    worker_id: workerId,
    delivery_status: 'delivered',
    delivered_event_id: insertedEvent?.id ?? null,
    error_code: isConflict ? 'already_delivered' : null,
    error_message: null
  });

  if (attemptError) {
    console.error('Failed to record delivered retry attempt.', attemptError.message);
    failed += 1;
    continue;
  }

  delivered += 1;
}

console.log(
  JSON.stringify(
    {
      queued: queuedRows.length,
      pending: pendingRows.length,
      delivered,
      skipped,
      failed,
      dryRun
    },
    null,
    2
  )
);

if (failed > 0) {
  process.exit(1);
}
