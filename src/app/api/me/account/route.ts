import { NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import { listAuthenticatedUserSessions } from "@/lib/session-management";
import { resolveSecurityStatus } from "@/lib/account-security";

export async function GET() {
  const authContext = await requireAuthenticatedApiUser();

  if (!authContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await authContext.supabase
    .schema("public")
    .from("profiles")
    .select("first_name,last_name,email")
    .eq("id", authContext.user.id)
    .maybeSingle();

  const sessionsResult = await listAuthenticatedUserSessions(authContext.accessToken);
  const ownSessions = (sessionsResult.sessions ?? []).filter((session) => session.userId === authContext.user.id);

  const factorResult = await authContext.supabase.auth.mfa.listFactors();
  const enrolledFactors = factorResult.data?.all ?? [];
  const hasMfa = enrolledFactors.length > 0;

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();

  return NextResponse.json(
    {
      profile: {
        name: fullName || authContext.user.user_metadata?.name || authContext.user.email?.split("@")[0] || "Account",
        email: profile?.email ?? authContext.user.email ?? "",
        securityStatus: resolveSecurityStatus(authContext.user, hasMfa, ownSessions.length),
        activeSessions: ownSessions.length,
        lastLogin: authContext.user.last_sign_in_at ?? null,
        mfaEnabled: hasMfa,
        emailVerified: Boolean(authContext.user.email_confirmed_at)
      }
    },
    { status: 200 }
  );
}
