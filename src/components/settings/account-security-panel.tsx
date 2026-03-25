"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AccountProfile {
  name: string;
  email: string;
  securityStatus: string;
  activeSessions: number;
  lastLogin: string | null;
  mfaEnabled: boolean;
  emailVerified: boolean;
}

interface DeviceItem {
  sessionId: string;
  label: string;
  ip: string | null;
  lastActiveAt: string | null;
  isCurrent: boolean;
}

interface AlertItem {
  id: string;
  message: string;
  createdAt: string | null;
  ip: string | null;
}

function formatDate(value: string | null) {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleString();
}

export function AccountSecurityPanel() {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [factors, setFactors] = useState<Array<{ id: string; friendlyName: string | null }>>([]);
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null);
  const [mfaUri, setMfaUri] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function load() {
    setError(null);

    const [accountRes, devicesRes, alertsRes, mfaRes] = await Promise.all([
      fetch("/api/me/account", { cache: "no-store" }),
      fetch("/api/me/devices", { cache: "no-store" }),
      fetch("/api/me/login-alerts", { cache: "no-store" }),
      fetch("/api/me/mfa", { cache: "no-store" })
    ]);

    if (!accountRes.ok) {
      setError("Unable to load account details.");
      return;
    }

    const accountPayload = (await accountRes.json()) as { profile: AccountProfile };
    const devicesPayload = devicesRes.ok ? ((await devicesRes.json()) as { devices?: DeviceItem[] }) : { devices: [] };
    const alertsPayload = alertsRes.ok ? ((await alertsRes.json()) as { alerts?: AlertItem[] }) : { alerts: [] };
    const mfaPayload = mfaRes.ok
      ? ((await mfaRes.json()) as { factors?: Array<{ id: string; friendlyName: string | null }> })
      : { factors: [] };

    setProfile(accountPayload.profile);
    setDevices(Array.isArray(devicesPayload.devices) ? devicesPayload.devices : []);
    setAlerts(Array.isArray(alertsPayload.alerts) ? alertsPayload.alerts : []);
    setFactors(Array.isArray(mfaPayload.factors) ? mfaPayload.factors : []);
  }

  useEffect(() => {
    void load();
  }, []);

  const primaryFactor = useMemo(() => factors[0] ?? null, [factors]);

  async function startMfaSetup() {
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const enrollRes = await fetch("/api/me/mfa/enroll", { method: "POST" });
    const enrollPayload = (await enrollRes.json()) as { factorId?: string; uri?: string; error?: string };

    if (!enrollRes.ok || !enrollPayload.factorId) {
      setError(enrollPayload.error ?? "Unable to start MFA setup.");
      setIsSubmitting(false);
      return;
    }

    const challengeRes = await fetch("/api/me/mfa/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ factorId: enrollPayload.factorId })
    });

    const challengePayload = (await challengeRes.json()) as { challengeId?: string; error?: string };
    if (!challengeRes.ok || !challengePayload.challengeId) {
      setError(challengePayload.error ?? "Unable to create MFA challenge.");
      setIsSubmitting(false);
      return;
    }

    setPendingFactorId(enrollPayload.factorId);
    setChallengeId(challengePayload.challengeId);
    setMfaUri(enrollPayload.uri ?? null);
    setMessage("Scan the URI in your authenticator app and enter the 6-digit code.");
    setIsSubmitting(false);
  }

  async function verifyMfa() {
    if (!pendingFactorId || !challengeId || !code.trim()) {
      setError("Enter the verification code from your authenticator app.");
      return;
    }

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const verifyRes = await fetch("/api/me/mfa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ factorId: pendingFactorId, challengeId, code: code.trim() })
    });

    const verifyPayload = (await verifyRes.json()) as { error?: string };

    if (!verifyRes.ok) {
      setError(verifyPayload.error ?? "Invalid MFA code.");
      setIsSubmitting(false);
      return;
    }

    setMessage("MFA enabled successfully.");
    setCode("");
    setChallengeId(null);
    setPendingFactorId(null);
    setMfaUri(null);
    await load();
    setIsSubmitting(false);
  }

  async function disableMfa() {
    if (!primaryFactor) {
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const response = await fetch(`/api/me/mfa/${primaryFactor.id}`, { method: "DELETE" });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Unable to disable MFA.");
      setIsSubmitting(false);
      return;
    }

    setMessage("MFA disabled.");
    await load();
    setIsSubmitting(false);
  }

  async function challengeExistingFactor() {
    if (!primaryFactor) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    const response = await fetch("/api/me/mfa/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ factorId: primaryFactor.id })
    });
    const payload = (await response.json()) as { challengeId?: string; error?: string };

    if (!response.ok || !payload.challengeId) {
      setError(payload.error ?? "Unable to create MFA challenge.");
      setIsSubmitting(false);
      return;
    }

    setPendingFactorId(primaryFactor.id);
    setChallengeId(payload.challengeId);
    setMfaUri(null);
    setMessage("Enter your authenticator code to confirm this MFA challenge.");
    setIsSubmitting(false);
  }

  async function resendVerification() {
    if (!profile?.email) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: profile.email })
    });
    const payload = (await response.json()) as { message?: string; error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Unable to resend verification email.");
      setIsSubmitting(false);
      return;
    }

    setMessage(payload.message ?? "If the account exists, a verification email has been sent.");
    setIsSubmitting(false);
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-semibold text-white">Account profile</h3>
        {profile ? (
          <dl className="mt-3 space-y-2 text-sm text-indigo-100/85">
            <div className="flex justify-between"><dt>Name</dt><dd>{profile.name}</dd></div>
            <div className="flex justify-between"><dt>Email</dt><dd>{profile.email}</dd></div>
            <div className="flex justify-between"><dt>Security status</dt><dd>{profile.securityStatus}</dd></div>
            <div className="flex justify-between"><dt>Active sessions</dt><dd>{profile.activeSessions}</dd></div>
            <div className="flex justify-between"><dt>Last login</dt><dd>{formatDate(profile.lastLogin)}</dd></div>
            <div className="flex justify-between"><dt>MFA status</dt><dd>{profile.mfaEnabled ? "Enabled" : "Disabled"}</dd></div>
            <div className="flex justify-between"><dt>Email verification</dt><dd>{profile.emailVerified ? "Verified" : "Pending"}</dd></div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-indigo-100/70">Loading account profile…</p>
        )}
        {profile && !profile.emailVerified ? (
          <Button className="mt-3" variant="secondary" onClick={resendVerification} disabled={isSubmitting}>
            Resend verification email
          </Button>
        ) : null}
      </Card>

      <Card>
        <h3 className="font-semibold text-white">Two-factor authentication</h3>
        <p className="mt-2 text-sm text-indigo-100/75">Use an authenticator app (TOTP) to protect your account.</p>

        {mfaUri ? <p className="mt-3 break-all rounded-lg bg-white/5 p-2 text-xs text-indigo-100">Setup URI: {mfaUri}</p> : null}

        {challengeId ? (
          <div className="mt-3 space-y-2">
            <Input placeholder="123456" value={code} onChange={(event) => setCode(event.target.value)} maxLength={8} />
            <Button onClick={verifyMfa} disabled={isSubmitting}>Verify MFA code</Button>
          </div>
        ) : primaryFactor ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={challengeExistingFactor} disabled={isSubmitting}>Confirm MFA challenge</Button>
            <Button variant="secondary" onClick={disableMfa} disabled={isSubmitting}>Disable MFA</Button>
          </div>
        ) : (
          <Button className="mt-3" onClick={startMfaSetup} disabled={isSubmitting}>Enable MFA</Button>
        )}

        {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </Card>

      <Card>
        <h3 className="font-semibold text-white">Device history</h3>
        <ul className="mt-3 space-y-2 text-sm text-indigo-100/80">
          {devices.map((device) => (
            <li key={device.sessionId} className="rounded-lg bg-white/5 px-3 py-2">
              {device.label} {device.isCurrent ? "(Current)" : ""} · IP {device.ip ?? "Unknown"} · Last active {formatDate(device.lastActiveAt)}
            </li>
          ))}
          {devices.length === 0 ? <li>No device history found.</li> : null}
        </ul>
      </Card>

      <Card>
        <h3 className="font-semibold text-white">Login alerts</h3>
        <ul className="mt-3 space-y-2 text-sm text-indigo-100/80">
          {alerts.map((alert) => (
            <li key={alert.id} className="rounded-lg bg-white/5 px-3 py-2">
              {alert.message} · IP {alert.ip ?? "Unknown"} · {formatDate(alert.createdAt)}
            </li>
          ))}
          {alerts.length === 0 ? <li>No recent login alerts.</li> : null}
        </ul>
      </Card>
    </div>
  );
}
