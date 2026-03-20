import { requireUser } from "@/lib/auth";

export default async function DashboardShellLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return children;
}
