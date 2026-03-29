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
    }): PromiseLike<{ error: { message: string } | null }>;
  };
}

export interface SessionAuditSink {
  onSessionRevoked(event: SessionRevokedAuditEvent): Promise<void>;
}

export function createSupabaseSessionAuditSink(supabase: SessionAuditInsertClient): SessionAuditSink {
  return {
    async onSessionRevoked(event) {
      const { error } = await supabase.from("security_session_events").insert({
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
  };
}

export async function emitSessionRevokedEvent(
  supabase: SessionAuditInsertClient,
  event: SessionRevokedAuditEvent
) {
  const sink = createSupabaseSessionAuditSink(supabase);
  await sink.onSessionRevoked(event);
}
