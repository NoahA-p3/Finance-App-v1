import { PropsWithChildren } from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { TopNav } from "@/components/shell/top-nav";

export function DashboardShell({ children, title }: PropsWithChildren<{ title: string }>) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav title={title} />
        <main className="mx-auto w-full max-w-[1200px] flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
