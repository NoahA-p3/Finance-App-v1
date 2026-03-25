const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface RawSessionRecord {
  id?: unknown;
  user_id?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  not_after?: unknown;
  ip?: unknown;
  user_agent?: unknown;
}

export interface UserSessionRecord {
  id: string;
  userId: string;
  createdAt: string | null;
  updatedAt: string | null;
  notAfter: string | null;
  ip: string | null;
  userAgent: string | null;
  isCurrent: boolean;
}

function decodeCurrentSessionId(accessToken: string) {
  try {
    const payloadSegment = accessToken.split(".")[1];

    if (!payloadSegment) {
      return null;
    }

    const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decodedPayload = atob(padded);
    const payload = JSON.parse(decodedPayload) as { session_id?: unknown };

    if (typeof payload.session_id !== "string" || !UUID_PATTERN.test(payload.session_id)) {
      return null;
    }

    return payload.session_id;
  } catch {
    return null;
  }
}

function normalizeSessionRecord(raw: RawSessionRecord, currentSessionId: string | null): UserSessionRecord | null {
  if (typeof raw.id !== "string" || !UUID_PATTERN.test(raw.id)) {
    return null;
  }

  if (typeof raw.user_id !== "string" || !UUID_PATTERN.test(raw.user_id)) {
    return null;
  }

  return {
    id: raw.id,
    userId: raw.user_id,
    createdAt: typeof raw.created_at === "string" ? raw.created_at : null,
    updatedAt: typeof raw.updated_at === "string" ? raw.updated_at : null,
    notAfter: typeof raw.not_after === "string" ? raw.not_after : null,
    ip: typeof raw.ip === "string" ? raw.ip : null,
    userAgent: typeof raw.user_agent === "string" ? raw.user_agent : null,
    isCurrent: currentSessionId === raw.id
  };
}

export async function listAuthenticatedUserSessions(accessToken: string) {
  const authUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!authUrl) {
    return { sessions: null, status: 500 } as const;
  }

  const response = await fetch(`${authUrl}/auth/v1/user/sessions`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return { sessions: null, status: response.status } as const;
  }

  const payload = (await response.json()) as { sessions?: RawSessionRecord[] };
  const currentSessionId = decodeCurrentSessionId(accessToken);
  const rawSessions = Array.isArray(payload.sessions) ? payload.sessions : [];
  const sessions = rawSessions
    .map((rawSession) => normalizeSessionRecord(rawSession, currentSessionId))
    .filter((session): session is UserSessionRecord => Boolean(session));

  return { sessions, status: 200 } as const;
}

export async function revokeAuthenticatedUserSession(accessToken: string, sessionId: string) {
  const authUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!authUrl) {
    return { ok: false, status: 500 } as const;
  }

  const response = await fetch(`${authUrl}/auth/v1/user/sessions/${sessionId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
    },
    cache: "no-store"
  });

  return { ok: response.ok, status: response.status } as const;
}

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}
