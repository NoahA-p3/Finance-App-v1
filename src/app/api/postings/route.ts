import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import { getCompanyMembershipContext } from "@/lib/company-permissions";
import { createPostingForTransaction, listPostings } from "@/lib/postings/service";

function readTransactionId(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "Request body must be a JSON object." } as const;
  }

  const raw = payload as Record<string, unknown>;
  const transactionId = typeof raw.transaction_id === "string" ? raw.transaction_id.trim() : "";

  if (!transactionId) {
    return { error: "transaction_id is required." } as const;
  }

  return { transactionId } as const;
}

export async function GET() {
  const authContext = await requireAuthenticatedApiUser();
  if (!authContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);
  if (!membership) return NextResponse.json({ error: "No company membership found." }, { status: 404 });

  try {
    const postings = await listPostings(authContext.supabase, membership.companyId);
    return NextResponse.json(postings);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to list postings." }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const authContext = await requireAuthenticatedApiUser();
  if (!authContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);
  if (!membership) return NextResponse.json({ error: "No company membership found." }, { status: 404 });

  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = readTransactionId(payload);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const posting = await createPostingForTransaction(authContext.supabase, authContext.user.id, membership.companyId, {
      transactionId: parsed.transactionId
    });

    return NextResponse.json(posting, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create posting." },
      { status: 400 }
    );
  }
}
