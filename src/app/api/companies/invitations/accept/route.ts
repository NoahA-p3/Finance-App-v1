import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";

interface AcceptanceResult {
  result: "accepted" | "already_accepted" | "expired" | "forbidden" | "invalid_token" | "status_invalid" | "unauthorized";
  invitation_id: string | null;
  company_id: string | null;
  role: string | null;
  status: string | null;
}

function normalizeToken(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const token = value.trim();
  return token.length >= 16 ? token : null;
}

export async function POST(req: NextRequest) {
  const authContext = await requireAuthenticatedApiUser();

  if (!authContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }

  const token = normalizeToken((payload as { token?: unknown }).token);

  if (!token) {
    return NextResponse.json({ error: "token must be a non-empty string." }, { status: 400 });
  }

  const { data, error } = await authContext.supabase.rpc("accept_company_invitation", {
    p_token: token
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const result = (Array.isArray(data) ? data[0] : data) as AcceptanceResult | null;

  if (!result) {
    return NextResponse.json({ error: "Invitation acceptance returned no result." }, { status: 500 });
  }

  if (result.result === "accepted" || result.result === "already_accepted") {
    return NextResponse.json({
      accepted: true,
      already_accepted: result.result === "already_accepted",
      invitation_id: result.invitation_id,
      active_company_id: result.company_id,
      role: result.role,
      status: result.status
    });
  }

  if (result.result === "expired") {
    return NextResponse.json({ error: "Invitation token has expired.", status: result.status ?? "expired" }, { status: 410 });
  }

  if (result.result === "forbidden") {
    return NextResponse.json({ error: "Invitation does not belong to the authenticated user." }, { status: 403 });
  }

  if (result.result === "status_invalid") {
    return NextResponse.json({ error: `Invitation is not pending (status: ${result.status ?? "unknown"}).` }, { status: 409 });
  }

  if (result.result === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ error: "Invalid invitation token." }, { status: 400 });
}
