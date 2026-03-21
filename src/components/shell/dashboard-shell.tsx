import { PropsWithChildren } from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { TopNav } from "@/components/shell/top-nav";
import { requireUser } from "@/lib/auth";

function resolveDisplayName(params: {
  profileFirstName: string | null;
  profileLastName: string | null;
  metadataFirstName: string | null;
  metadataLastName: string | null;
  email: string;
}) {
  const nameFromProfile = [params.profileFirstName, params.profileLastName].filter(Boolean).join(" ").trim();
  if (nameFromProfile) {
    return nameFromProfile;
  }

  const nameFromMetadata = [params.metadataFirstName, params.metadataLastName].filter(Boolean).join(" ").trim();
  if (nameFromMetadata) {
    return nameFromMetadata;
  }

  const emailPrefix = params.email.split("@")[0]?.trim();
  return emailPrefix || "Account";
}

export async function DashboardShell({ children, title }: PropsWithChildren<{ title: string }>) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name,last_name,email")
    .eq("id", user.id)
    .maybeSingle();

  const userEmail = profile?.email ?? user.email ?? "";
  const displayName = resolveDisplayName({
    profileFirstName: profile?.first_name ?? null,
    profileLastName: profile?.last_name ?? null,
    metadataFirstName: (user.user_metadata?.first_name as string | undefined) ?? null,
    metadataLastName: (user.user_metadata?.last_name as string | undefined) ?? null,
    email: userEmail
  });

  return (
    <div className="min-h-screen bg-[#171a36] text-slate-100 lg:h-screen lg:overflow-hidden">
      <div className="mx-auto w-full max-w-[1500px] p-3 lg:p-4">
        <Sidebar user={{ id: user.id, name: displayName, email: userEmail }} />
        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:h-[calc(100vh-2rem)] lg:pl-[266px]">
          <TopNav title={title} user={{ id: user.id, name: displayName, email: userEmail }} />
          <main className="flex-1 lg:overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
