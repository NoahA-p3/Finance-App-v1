import { NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import { listAuthenticatedUserSessions } from "@/lib/session-management";

export async function GET() {
  const authContext = await requireAuthenticatedApiUser();

  if (!authContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessions, status } = await listAuthenticatedUserSessions(authContext.accessToken);

  if (!sessions) {
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Unable to retrieve sessions." }, { status: 502 });
  }

  const ownSessions = sessions.filter((activeSession) => activeSession.userId === authContext.user.id);

  return NextResponse.json({ sessions: ownSessions }, { status: 200 });
}
