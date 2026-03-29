"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CompanyProfileForm } from "@/components/settings/company-profile-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite")?.trim() ?? "";

  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [acceptMessage, setAcceptMessage] = useState<string | null>(null);

  const hasInvite = useMemo(() => inviteToken.length >= 16, [inviteToken]);

  async function acceptInvite() {
    if (!hasInvite) {
      return;
    }

    setIsAccepting(true);
    setAcceptError(null);
    setAcceptMessage(null);

    const response = await fetch("/api/companies/invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: inviteToken })
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string; already_accepted?: boolean };

    if (!response.ok) {
      setIsAccepting(false);
      setAcceptError(payload.error ?? "Unable to accept invitation.");
      return;
    }

    setAcceptMessage(payload.already_accepted ? "Invitation already accepted. Active company confirmed." : "Invitation accepted. Active company updated.");
    setIsAccepting(false);
    router.refresh();
  }

  useEffect(() => {
    if (!hasInvite) {
      return;
    }

    void acceptInvite();
  }, [hasInvite]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-4 px-4">
      {hasInvite ? (
        <Card>
          <h2 className="text-lg font-semibold text-white">Team invitation</h2>
          <p className="mt-2 text-sm text-slate-300">Accept the invitation to join the company and switch your active company context.</p>
          {acceptError ? <p className="mt-3 text-sm text-rose-300">{acceptError}</p> : null}
          {acceptMessage ? <p className="mt-3 text-sm text-emerald-300">{acceptMessage}</p> : null}
          <div className="mt-3 flex items-center gap-2">
            <Button type="button" onClick={() => void acceptInvite()} disabled={isAccepting}>
              {isAccepting ? "Accepting..." : "Accept invitation"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push("/dashboard")}>
              Continue to dashboard
            </Button>
          </div>
        </Card>
      ) : null}

      <CompanyProfileForm isOnboarding />
    </main>
  );
}
