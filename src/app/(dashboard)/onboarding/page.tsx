"use client";

import { CompanyProfileForm } from "@/components/settings/company-profile-form";

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4">
      <CompanyProfileForm isOnboarding />
    </main>
  );
}
