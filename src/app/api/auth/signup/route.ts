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
  const { email, password, username, firstName, lastName, phone } = await req.json();

  if (!email || !password || !username || !firstName || !lastName || !phone) {
    return NextResponse.json(
      { error: "Email, username, first name, last name, phone, and password are required." },
      { status: 400 }
    );
  }

  const siteUrl = resolveSiteUrl(req.url);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        first_name: firstName,
        last_name: lastName,
        phone
      },
      emailRedirectTo: `${siteUrl}/login`
    }
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(
    {
      user: data.user,
      requiresEmailConfirmation: !data.session
    },
    { status: 201 }
  );
}
