import { PropsWithChildren } from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { TopNav } from "@/components/shell/top-nav";

export function DashboardShell({ children, title }: PropsWithChildren<{ title: string }>) {
  return (
    <div className="min-h-screen bg-[#171a36] text-slate-100 lg:h-screen lg:overflow-hidden">
      <div className="mx-auto w-full max-w-[1500px] p-3 lg:p-4">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:h-[calc(100vh-2rem)] lg:pl-[266px]">
          <TopNav title={title} />
          <main className="flex-1 lg:overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
