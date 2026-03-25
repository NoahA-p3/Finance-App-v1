import type { User } from "@supabase/supabase-js";
import type { UserSessionRecord } from "@/lib/session-management";

export interface DeviceHistoryItem {
  sessionId: string;
  label: string;
  ip: string | null;
  lastActiveAt: string | null;
  createdAt: string | null;
  isCurrent: boolean;
}

export interface LoginAlertItem {
  id: string;
  type: "new_device_login";
  message: string;
  createdAt: string | null;
  ip: string | null;
}

export function toDeviceHistory(sessions: UserSessionRecord[]): DeviceHistoryItem[] {
  return sessions
    .map((session) => ({
      sessionId: session.id,
      label: session.userAgent?.trim() || (session.isCurrent ? "Current device" : "Active device"),
      ip: session.ip,
      lastActiveAt: session.updatedAt ?? session.createdAt,
      createdAt: session.createdAt,
      isCurrent: session.isCurrent
    }))
    .sort((a, b) => {
      const aTs = a.lastActiveAt ? Date.parse(a.lastActiveAt) : 0;
      const bTs = b.lastActiveAt ? Date.parse(b.lastActiveAt) : 0;
      return bTs - aTs;
    });
}

export function toLoginAlerts(sessions: UserSessionRecord[]): LoginAlertItem[] {
  return sessions
    .filter((session) => !session.isCurrent)
    .sort((a, b) => Date.parse(b.updatedAt ?? b.createdAt ?? "") - Date.parse(a.updatedAt ?? a.createdAt ?? ""))
    .slice(0, 10)
    .map((session) => ({
      id: session.id,
      type: "new_device_login",
      message: "New login detected on another device.",
      createdAt: session.updatedAt ?? session.createdAt,
      ip: session.ip
    }));
}

export function resolveSecurityStatus(user: User, hasMfa: boolean, sessionCount: number) {
  if (hasMfa && Boolean(user.email_confirmed_at) && sessionCount > 0) {
    return "Strong";
  }

  if (Boolean(user.email_confirmed_at)) {
    return "Moderate";
  }

  return "Action required";
}
