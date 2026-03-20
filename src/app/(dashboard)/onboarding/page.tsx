"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4">
      <Card>
        {step === 1 && <><h1 className="text-2xl font-semibold">Let&apos;s set up your finance assistant</h1><p className="mt-2 text-sm text-slate-500">We&apos;ll configure your business in under 2 minutes.</p></>}
        {step === 2 && <div className="space-y-3"><h2 className="text-xl font-semibold">Business information</h2><Input placeholder="Business name" /><Input placeholder="Country" /><label className="flex gap-2 text-sm"><input type="checkbox" /> VAT registered</label></div>}
        {step === 3 && <div><h2 className="text-xl font-semibold">Connect bank account</h2><p className="mt-2 text-sm text-slate-500">Secure bank connection UI placeholder.</p><div className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">Bank connector component placeholder</div></div>}
        {step === 4 && <div><h2 className="text-xl font-semibold">Setup complete</h2><p className="mt-2 text-sm text-slate-500">Your workspace is ready. Redirecting to dashboard...</p></div>}
        <div className="mt-6 flex justify-between">
          <Button variant="ghost" onClick={() => setStep((v) => Math.max(1, v - 1))}>Back</Button>
          {step < 4 ? (
            <Button onClick={() => setStep((v) => v + 1)}>Continue</Button>
          ) : (
            <Button onClick={() => router.push('/dashboard')}>Go to dashboard</Button>
          )}
        </div>
      </Card>
    </main>
  );
}
