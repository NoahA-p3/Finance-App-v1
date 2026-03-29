export interface SessionRevokedAuditEvent {
  actorUserId: string;
  revokedSessionId: string;
  revokedAt: string;
}

interface SessionAuditInsertClient {
  from(table: "security_session_events"): {
    insert(payload: {
      actor_user_id: string;
      target_session_id: string;
      event_type: "session.revoked";
      occurred_at: string;
      metadata: Record<string, never>;
      idempotency_key?: string;
    }): PromiseLike<{ error: { message: string } | null }>;
  };
}

interface SessionAuditRetryQueueClient {
  from(table: "security_event_retry_queue"): {
    insert(payload: {
      idempotency_key: string;
      actor_user_id: string;
      target_session_id: string;
      event_type: "session.revoked";
      occurred_at: string;
      metadata: Record<string, never>;
    }): PromiseLike<{ error: { message: string } | null }>;
  };
}

export interface SessionAuditSink {
  onSessionRevoked(event: SessionRevokedAuditEvent): Promise<void>;
}

export function getSessionRevocationIdempotencyKey(event: SessionRevokedAuditEvent): string {
  return `session.revoked:${event.actorUserId}:${event.revokedSessionId}:${event.revokedAt}`;
}

export function createSupabaseSessionAuditSink(supabase: SessionAuditInsertClient): SessionAuditSink {
  return {
    async onSessionRevoked(event) {
      const { error } = await supabase.from("security_session_events").insert({
        actor_user_id: event.actorUserId,
        target_session_id: event.revokedSessionId,
        event_type: "session.revoked",
        occurred_at: event.revokedAt,
        metadata: {},
        idempotency_key: getSessionRevocationIdempotencyKey(event)
      });

      if (error) {
        throw new Error(error.message);
      }
    }
  };
}

export async function emitSessionRevokedEvent(
  supabase: SessionAuditInsertClient,
  event: SessionRevokedAuditEvent
) {
  const sink = createSupabaseSessionAuditSink(supabase);
  await sink.onSessionRevoked(event);
}

export async function enqueueSessionRevokedEventRetry(
  supabase: SessionAuditRetryQueueClient,
  event: SessionRevokedAuditEvent
) {
  const { error } = await supabase.from("security_event_retry_queue").insert({
    idempotency_key: getSessionRevocationIdempotencyKey(event),
    actor_user_id: event.actorUserId,
    target_session_id: event.revokedSessionId,
    event_type: "session.revoked",
    occurred_at: event.revokedAt,
    metadata: {}
  });

  if (error) {
    throw new Error(error.message);
  }
}
