import { NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import { getCompanyMembershipContext } from "@/lib/company-permissions";

export async function POST(req: Request) {
  const authContext = await requireAuthenticatedApiUser();
  if (!authContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);
  if (!membership) return NextResponse.json({ error: "No company membership found." }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });

  const filePath = `${authContext.user.id}/${membership.companyId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await authContext.supabase.storage.from("receipts").upload(filePath, file, { upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });

  const { data, error } = await authContext.supabase
    .from("receipts")
    .insert({ user_id: authContext.user.id, company_id: membership.companyId, path: filePath })
    .select("id,path")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(data, { status: 201 });
}
