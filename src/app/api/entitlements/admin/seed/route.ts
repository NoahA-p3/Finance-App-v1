import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import { getCompanyMembershipContext } from "@/lib/company-permissions";

interface SeedBody {
  plan_key?: string;
}

export async function POST(req: NextRequest) {
  const authContext = await requireAuthenticatedApiUser();
  if (!authContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);
  if (!membership) return NextResponse.json({ error: "No company membership found." }, { status: 404 });
  if (membership.role !== "owner") {
    return NextResponse.json({ error: "Only owners can seed subscription config." }, { status: 403 });
  }

  let body: SeedBody = {};
  try {
    body = (await req.json()) as SeedBody;
  } catch {
    body = {};
  }

  const requestedPlanKey = typeof body.plan_key === "string" ? body.plan_key.trim().toLowerCase() : "starter";

  if (!requestedPlanKey) {
    return NextResponse.json({ error: "plan_key must be a non-empty string." }, { status: 400 });
  }

  const { data: plan, error: planError } = await authContext.supabase
    .from("plans")
    .select("id, key, name")
    .eq("key", requestedPlanKey)
    .maybeSingle();

  if (planError || !plan) {
    return NextResponse.json({ error: "Unknown plan_key." }, { status: 400 });
  }

  await authContext.supabase
    .from("company_subscriptions")
    .update({ status: "cancelled" })
    .eq("company_id", membership.companyId)
    .in("status", ["active", "trialing"]);

  const nowIso = new Date().toISOString().slice(0, 10);
  const nextMonth = new Date();
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);

  const { data: subscription, error: insertError } = await authContext.supabase
    .from("company_subscriptions")
    .insert({
      company_id: membership.companyId,
      plan_id: plan.id,
      status: "active",
      source: "internal_admin",
      current_period_start: nowIso,
      current_period_end: nextMonth.toISOString().slice(0, 10)
    })
    .select("id, status, source, current_period_start, current_period_end")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({
    company_id: membership.companyId,
    plan,
    subscription
  });
}
