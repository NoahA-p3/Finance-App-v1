"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function Navbar() {
  const router = useRouter();

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <h1 className="font-semibold">Finance Assistant</h1>
      <button className="rounded-lg border border-slate-300 px-3 py-1 text-sm" onClick={signOut}>
        Sign out
      </button>
    </header>
  );
}
