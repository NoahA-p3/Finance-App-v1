export interface SessionRevokedAuditEvent {
  actorUserId: string;
  revokedSessionId: string;
  revokedAt: string;
}

export interface SessionAuditSink {
  onSessionRevoked(event: SessionRevokedAuditEvent): Promise<void>;
}

const noopSessionAuditSink: SessionAuditSink = {
  async onSessionRevoked(_event) {
    // TODO: Persist immutable audit event once dedicated audit subsystem exists.
  }
};

export async function emitSessionRevokedEvent(event: SessionRevokedAuditEvent) {
  await noopSessionAuditSink.onSessionRevoked(event);
}
