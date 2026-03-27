import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import { COMPANY_PERMISSIONS, getCompanyMembershipContext, hasCompanyPermission } from "@/lib/company-permissions";
import { createPeriodLock, listPeriodLocks } from "@/lib/postings/service";

function parsePeriodLockPayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "Request body must be a JSON object." } as const;
  }

  const raw = payload as Record<string, unknown>;

  const startDate = typeof raw.start_date === "string" ? raw.start_date.trim() : "";
  const endDate = typeof raw.end_date === "string" ? raw.end_date.trim() : "";
  const reason = typeof raw.reason === "string" ? raw.reason : undefined;

  if (!startDate || !endDate) {
    return { error: "start_date and end_date are required." } as const;
  }

  return {
    startDate,
    endDate,
    reason
  } as const;
}

export async function GET() {
  const authContext = await requireAuthenticatedApiUser();
  if (!authContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);
  if (!membership) return NextResponse.json({ error: "No company membership found." }, { status: 404 });

  try {
    const locks = await listPeriodLocks(authContext.supabase, membership.companyId);
    return NextResponse.json(locks);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list period locks." },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authContext = await requireAuthenticatedApiUser();
  if (!authContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);
  if (!membership) return NextResponse.json({ error: "No company membership found." }, { status: 404 });
  if (!hasCompanyPermission(membership, COMPANY_PERMISSIONS.FINANCE_PERIOD_LOCKS_MANAGE)) {
    return NextResponse.json({ error: "Missing required permission: finance.period_locks.manage" }, { status: 403 });
  }

  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parsePeriodLockPayload(payload);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const periodLock = await createPeriodLock(authContext.supabase, authContext.user.id, membership.companyId, parsed);
    return NextResponse.json(periodLock, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create period lock." },
      { status: 400 }
    );
  }
}
