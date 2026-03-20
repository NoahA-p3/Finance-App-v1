import DashboardLayout from "@/components/dashboard-ui/dashboard-layout";
import { requireUser } from "@/lib/auth";

export default async function DashboardPage() {
  const { user } = await requireUser();

  const displayName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    user.email?.split("@")[0] ||
    "User";

  return <DashboardLayout name={displayName} />;
}
