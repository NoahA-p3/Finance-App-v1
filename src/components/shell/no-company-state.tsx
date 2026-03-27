import Link from "next/link";
import { Card } from "@/components/ui/card";

export function NoCompanyState() {
  return (
    <Card>
      <div className="space-y-3 text-indigo-100">
        <h3 className="text-lg font-semibold text-white">Finish company setup</h3>
        <p className="max-w-2xl text-sm text-indigo-200/80">
          You can keep using all pages while onboarding is in progress. Complete onboarding to create or join a company so
          company-specific data can load across the workspace.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center rounded-xl bg-cyan-300 px-4 py-2 text-sm font-medium text-[#1c1f3e] transition hover:bg-cyan-200"
          >
            Open setup guide
          </Link>
          <Link
            href="/settings/company"
            className="inline-flex items-center justify-center rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-indigo-100 transition hover:bg-white/20"
          >
            Open company settings
          </Link>
        </div>
      </div>
    </Card>
  );
}
