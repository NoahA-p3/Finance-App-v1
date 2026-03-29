import { NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import {
  isUuid,
  listAuthenticatedUserSessions,
  revokeAuthenticatedUserSession
} from "@/lib/session-management";
import { emitSessionRevokedEvent, enqueueSessionRevokedEventRetry } from "@/lib/session-events";

interface RouteContext {
  params: Promise<{
    session_id: string;
  }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { session_id: sessionId } = await context.params;

  if (!isUuid(sessionId)) {
    return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
  }

  const authContext = await requireAuthenticatedApiUser();

  if (!authContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessions, status } = await listAuthenticatedUserSessions(authContext.accessToken);

  if (!sessions) {
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Unable to revoke session." }, { status: 502 });
  }

  const ownSessions = sessions.filter((activeSession) => activeSession.userId === authContext.user.id);
  const targetSession = ownSessions.find((activeSession) => activeSession.id === sessionId);

  if (!targetSession) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (targetSession.isCurrent) {
    return NextResponse.json({ error: "Cannot revoke current session." }, { status: 400 });
  }

  const revokeResult = await revokeAuthenticatedUserSession(authContext.accessToken, sessionId);

  if (!revokeResult.ok) {
    if (revokeResult.status === 401 || revokeResult.status === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Unable to revoke session." }, { status: 502 });
  }

  const revokedAt = new Date().toISOString();

  try {
    await emitSessionRevokedEvent(authContext.supabase, {
      actorUserId: authContext.user.id,
      revokedSessionId: sessionId,
      revokedAt
    });
  } catch (error) {
    console.error("session_revocation_audit_write_failed", {
      actorUserId: authContext.user.id,
      revokedSessionId: sessionId,
      error: error instanceof Error ? error.message : "unknown_error"
    });

    try {
      await enqueueSessionRevokedEventRetry(authContext.supabase, {
        actorUserId: authContext.user.id,
        revokedSessionId: sessionId,
        revokedAt
      });
    } catch (enqueueError) {
      console.error("session_revocation_audit_retry_enqueue_failed", {
        actorUserId: authContext.user.id,
        revokedSessionId: sessionId,
        error: enqueueError instanceof Error ? enqueueError.message : "unknown_error"
      });
    }
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
