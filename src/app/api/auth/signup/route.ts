import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function resolveSiteUrl(requestUrl: string) {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredSiteUrl) {
    return configuredSiteUrl.replace(/\/$/, "");
  }

  return new URL(requestUrl).origin;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const siteUrl = resolveSiteUrl(req.url);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/login`
    }
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: data.user }, { status: 201 });
}
