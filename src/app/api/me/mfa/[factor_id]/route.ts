import { NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ factor_id: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authContext = await requireAuthenticatedApiUser();

  if (!authContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { factor_id: factorId } = await context.params;

  if (!factorId) {
    return NextResponse.json({ error: "factor_id is required." }, { status: 400 });
  }

  const response = await authContext.supabase.auth.mfa.unenroll({ factorId });

  if (response.error) {
    return NextResponse.json({ error: "Unable to disable MFA." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
