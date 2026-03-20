"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AuthFormProps {
  mode: "login" | "signup";
}

async function getErrorMessage(response: Response): Promise<string> {
  const text = await response.text();

  if (!text) {
    return `Unable to authenticate (HTTP ${response.status}).`;
  }

  try {
    const payload = JSON.parse(text) as { error?: string };

    if (payload.error) {
      return payload.error;
    }
  } catch {
    // Ignore JSON parse errors and fall through to a trimmed plain-text error.
  }

  return text.trim() || `Unable to authenticate (HTTP ${response.status}).`;
}

export function AuthForm({ mode }: AuthFormProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(
          mode === "login"
            ? { identifier, password }
            : {
                email: identifier,
                password,
                username,
                firstName,
                lastName,
                phoneCountryCode,
                phoneNumber
              }
        )
      });

      if (!response.ok) {
        setError(await getErrorMessage(response));
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="w-full space-y-4 rounded-xl border border-slate-200 bg-white p-6" onSubmit={handleSubmit}>
      <h1 className="text-2xl font-semibold capitalize">{mode}</h1>
      <div>
        <label className="mb-1 block text-sm text-slate-600">
          {mode === "login" ? "Email or Username" : "Email"}
        </label>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          type={mode === "login" ? "text" : "email"}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
      </div>
      {mode === "signup" && (
        <>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Username</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-slate-600">First name</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Last name</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Phone number (optional)</label>
            <div className="grid grid-cols-[7rem_1fr] gap-2">
              <select
                className="rounded-lg border border-slate-300 bg-white px-2 py-2"
                value={phoneCountryCode}
                onChange={(e) => setPhoneCountryCode(e.target.value)}
              >
                <option value="+1">+1 (US/CA)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+61">+61 (AU)</option>
                <option value="+91">+91 (IN)</option>
              </select>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="5551234567"
              />
            </div>
          </div>
        </>
      )}
      <div>
        <label className="mb-1 block text-sm text-slate-600">Password</label>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="w-full rounded-lg bg-slate-900 py-2 text-white" disabled={loading} type="submit">
        {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}
