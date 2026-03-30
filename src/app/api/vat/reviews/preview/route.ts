import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import { getCompanyMembershipContext } from "@/lib/company-permissions";
import { previewVatReview } from "@/lib/vat/reviews/preview";

function readPreviewPayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "Request body must be a JSON object." } as const;
  }

  const raw = payload as Record<string, unknown>;
  const periodStart = typeof raw.period_start === "string" ? raw.period_start.trim() : "";
  const periodEnd = typeof raw.period_end === "string" ? raw.period_end.trim() : "";

  if (!periodStart || !periodEnd) {
    return { error: "period_start and period_end are required." } as const;
  }

  const engineVersion = typeof raw.engine_version === "string" ? raw.engine_version.trim() : undefined;

  return {
    value: {
      periodStart,
      periodEnd,
      engineVersion
    }
  } as const;
}

function canPreviewVatReview(role: string) {
  // TODO: include explicit `admin` role after role contract introduces it.
  return role === "owner" || role === "accountant";
}

export async function POST(req: NextRequest) {
  const authContext = await requireAuthenticatedApiUser();
  if (!authContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);
  if (!membership) {
    return NextResponse.json({ error: "No company membership found." }, { status: 404 });
  }

  if (!canPreviewVatReview(membership.role)) {
    return NextResponse.json(
      {
        error:
          "Missing required VAT review preview role. Baseline allows owner/accountant only (TODO: admin role pending repository role contract evidence)."
      },
      { status: 403 }
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = readPreviewPayload(payload);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = await previewVatReview(authContext.supabase, membership.companyId, parsed.value);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate VAT review preview." },
      { status: 400 }
    );
  }
}
