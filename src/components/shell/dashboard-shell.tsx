import { PropsWithChildren } from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { TopNav } from "@/components/shell/top-nav";

export function DashboardShell({ children, title }: PropsWithChildren<{ title: string }>) {
  return (
    <div className="min-h-screen bg-[#171a36] text-slate-100">
      <div className="mx-auto flex w-full max-w-[1500px] gap-4 p-3 lg:p-4">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <TopNav title={title} />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
