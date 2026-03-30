import { NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import { getCompanyMembershipContext } from "@/lib/company-permissions";

const SUPPORTED_FORMATS = [
  { id: "json", content_type: "application/json" },
  { id: "csv", content_type: "text/csv; charset=utf-8" }
] as const;

export async function GET() {
  const authContext = await requireAuthenticatedApiUser();
  if (!authContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);
  if (!membership) return NextResponse.json({ error: "No company membership found." }, { status: 404 });

  return NextResponse.json({
    formats: SUPPORTED_FORMATS
  });
}
