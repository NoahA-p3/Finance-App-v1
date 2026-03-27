import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import { COMPANY_PERMISSIONS, getCompanyMembershipContext, hasCompanyPermission } from "@/lib/company-permissions";
import { reversePosting } from "@/lib/postings/service";

interface RouteContext {
  params: Promise<{
    posting_id: string;
  }>;
}

function readReversalReason(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "Request body must be a JSON object." } as const;
  }

  const raw = payload as Record<string, unknown>;
  const reason = typeof raw.reason === "string" ? raw.reason.trim() : "";

  if (!reason) {
    return { error: "reason is required." } as const;
  }

  return { reason } as const;
}

export async function POST(req: NextRequest, context: RouteContext) {
  const authContext = await requireAuthenticatedApiUser();
  if (!authContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);
  if (!membership) return NextResponse.json({ error: "No company membership found." }, { status: 404 });
  if (!hasCompanyPermission(membership, COMPANY_PERMISSIONS.FINANCE_POSTINGS_WRITE)) {
    return NextResponse.json({ error: "Missing required permission: finance.postings.write" }, { status: 403 });
  }

  const { posting_id: postingId } = await context.params;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = readReversalReason(payload);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = await reversePosting(authContext.supabase, authContext.user.id, membership.companyId, {
      postingId,
      reason: parsed.reason
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reverse posting." },
      { status: 400 }
    );
  }
}
