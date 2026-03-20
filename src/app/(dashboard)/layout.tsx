import { PropsWithChildren } from "react";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: PropsWithChildren) {
  await requireUser();
  return children;
}
