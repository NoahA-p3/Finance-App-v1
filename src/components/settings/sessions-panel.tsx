"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SessionRow {
  id: string;
  userId: string;
  createdAt: string | null;
  updatedAt: string | null;
  notAfter: string | null;
  ip: string | null;
  userAgent: string | null;
  isCurrent: boolean;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown";
  }

  return parsedDate.toLocaleString();
}

function getSessionLabel(session: SessionRow) {
  const agent = session.userAgent?.trim();

  if (agent) {
    return agent;
  }

  return session.isCurrent ? "Current session" : "Active session";
}

export function SessionsPanel() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  const otherSessions = useMemo(() => sessions.filter((session) => !session.isCurrent), [sessions]);

  async function loadSessions() {
    setIsLoading(true);
    setError(null);

    const response = await fetch("/api/me/sessions", { method: "GET", cache: "no-store" });

    if (!response.ok) {
      setIsLoading(false);
      setError(response.status === 401 ? "Please sign in again to view sessions." : "Unable to load active sessions.");
      return;
    }

    const payload = (await response.json()) as { sessions?: SessionRow[] };
    setSessions(Array.isArray(payload.sessions) ? payload.sessions : []);
    setIsLoading(false);
  }

  useEffect(() => {
    void loadSessions();
  }, []);

  async function revokeSession(sessionId: string) {
    setRevokingSessionId(sessionId);
    setError(null);

    const response = await fetch(`/api/me/sessions/${sessionId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      setRevokingSessionId(null);
      setError(response.status === 403 ? "You are not allowed to revoke this session." : "Unable to revoke session.");
      return;
    }

    setRevokingSessionId(null);
    await loadSessions();
  }

  return (
    <Card>
      <h3 className="font-semibold text-white">Active Sessions</h3>
      <p className="mt-2 text-sm text-indigo-100/75">Review your signed-in devices and revoke old sessions.</p>

      {isLoading ? <p className="mt-4 text-sm text-indigo-100/80">Loading sessions...</p> : null}
      {error ? <p className="mt-4 text-sm text-rose-200">{error}</p> : null}

      {!isLoading && !error && sessions.length === 0 ? <p className="mt-4 text-sm text-indigo-100/80">No active sessions found.</p> : null}

      {!isLoading && !error && sessions.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {sessions.map((session) => (
            <li key={session.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{getSessionLabel(session)}</p>
                  <p className="mt-1 text-xs text-indigo-100/70">Last active: {formatDate(session.updatedAt ?? session.createdAt)}</p>
                  <p className="mt-1 text-xs text-indigo-100/60">IP: {session.ip ?? "Unknown"}</p>
                </div>
                {session.isCurrent ? (
                  <span className="rounded-full bg-cyan-300/20 px-2 py-1 text-xs font-medium text-cyan-100">Current</span>
                ) : (
                  <Button
                    variant="secondary"
                    className="px-3 py-1 text-xs"
                    onClick={() => revokeSession(session.id)}
                    disabled={revokingSessionId === session.id}
                  >
                    {revokingSessionId === session.id ? "Revoking..." : "Revoke"}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {!isLoading && !error && otherSessions.length === 0 ? <p className="mt-4 text-xs text-indigo-100/70">No other sessions to revoke.</p> : null}
    </Card>
  );
}
