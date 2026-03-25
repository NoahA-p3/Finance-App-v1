"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bootstrappingSession, setBootstrappingSession] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;

    const bootstrapRecoverySession = async () => {
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      const done = () => {
        if (mounted) {
          setBootstrappingSession(false);
        }
      };

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          if (mounted) {
            setError("Reset link is invalid or expired. Please request a new reset link.");
          }
          done();
          return;
        }

        done();
        return;
      }

      if (tokenHash && type === "recovery") {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery"
        });

        if (verifyError) {
          if (mounted) {
            setError("Reset link is invalid or expired. Please request a new reset link.");
          }
          done();
          return;
        }

        done();
        return;
      }

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session && mounted) {
        setError("Reset link is invalid or expired. Please request a new reset link.");
      }

      done();
    };

    void bootstrapRecoverySession();

    return () => {
      mounted = false;
    };
  }, [searchParams, supabase]);

  const passwordStrength = useMemo(() => {
    if (!password) {
      return "";
    }

    const checks = [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)];
    const score = checks.filter(Boolean).length;

    if (score <= 1) {
      return "Weak";
    }

    if (score <= 3) {
      return "Fair";
    }

    return "Strong";
  }, [password]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (bootstrappingSession) {
      setError("Validating reset link. Please wait a moment and try again.");
      return;
    }

    if (password.length < 8) {
      setError("Use at least 8 characters for better security.");
      return;
    }

    if (confirmPassword !== password) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password })
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(payload.error ?? "Unable to reset password.");
        return;
      }

      setSuccess(payload.message ?? "Password updated successfully.");
      setTimeout(() => {
        router.push("/login?reset=success");
        router.refresh();
      }, 1200);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4 rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-md transition-all duration-300 dark:border-slate-700 dark:bg-slate-950/80">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Reset password</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Set a new password for your account.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">New password</label>
          <input
            className="w-full rounded-xl border border-slate-300 bg-white/70 px-3 py-2.5 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:ring-indigo-900/30"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter new password"
            required
          />
          {passwordStrength && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Strength: <span className="font-semibold">{passwordStrength}</span>
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm password</label>
          <input
            className="w-full rounded-xl border border-slate-300 bg-white/70 px-3 py-2.5 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:ring-indigo-900/30"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter new password"
            required
          />
        </div>

        {bootstrappingSession && (
          <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Validating reset link…
          </p>
        )}
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
        {success && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {success}
          </p>
        )}

        <button
          className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus:ring-indigo-900"
          disabled={loading || bootstrappingSession}
          type="submit"
        >
          {loading ? "Please wait..." : "Update password"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Back to{" "}
        <Link href="/login" className="font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400">
          Sign in
        </Link>
      </p>
    </div>
  );
}
