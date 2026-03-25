"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface EntitlementRecord {
  entitlement_key: string;
  limit_value: string | null;
  warning_threshold_percent: number;
  is_enforced: boolean;
}

interface EntitlementResponse {
  plan: { key: string; name: string; status: string };
  entitlements: EntitlementRecord[];
  usage: {
    monthlyVoucherCount: number;
    rollingTurnover12mDkk: string;
  };
}

export function EntitlementsPanel() {
  const [data, setData] = useState<EntitlementResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const response = await fetch("/api/entitlements", { cache: "no-store" });
      const body = (await response.json().catch(() => ({}))) as EntitlementResponse & { error?: string };

      if (!isMounted) return;

      if (!response.ok) {
        setError(body.error ?? "Unable to load plan and entitlements.");
        return;
      }

      setData(body);
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Card>
      <h3 className="font-semibold text-white">Plan & usage</h3>
      <p className="mt-2 text-sm text-indigo-100/80">Limits are enforced server-side. Upgrade prompts appear when thresholds are reached.</p>

      {error ? <p className="mt-4 text-sm text-rose-200">{error}</p> : null}

      {data ? (
        <div className="mt-4 space-y-3 text-sm text-indigo-100/90">
          <p>
            Current plan: <span className="font-semibold text-white">{data.plan.name}</span> ({data.plan.key}, {data.plan.status})
          </p>
          <p>Monthly vouchers used: {data.usage.monthlyVoucherCount}</p>
          <p>Rolling turnover (12m, DKK): {data.usage.rollingTurnover12mDkk}</p>

          <div className="space-y-2">
            {data.entitlements.map((entitlement) => (
              <div key={entitlement.entitlement_key} className="rounded-md border border-white/10 p-2">
                <p className="font-medium text-white">{entitlement.entitlement_key}</p>
                <p>
                  Limit: {entitlement.limit_value ?? "Unlimited"} · warning at {entitlement.warning_threshold_percent}% ·{" "}
                  {entitlement.is_enforced ? "enforced" : "not enforced"}
                </p>
              </div>
            ))}
          </div>

          <p className="rounded-md border border-amber-300/40 bg-amber-500/10 p-2 text-amber-100">
            If you hit a soft lock, create fewer entries this period or upgrade your plan tier.
          </p>
        </div>
      ) : null}
    </Card>
  );
}
