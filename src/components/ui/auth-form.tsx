"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import type { Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface AuthFormProps {
  mode: "login" | "signup";
}

type CountryOption = {
  code: string;
  dialCode: string;
  flag: string;
  label: string;
};

const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "US", dialCode: "+1", flag: "🇺🇸", label: "United States" },
  { code: "CA", dialCode: "+1", flag: "🇨🇦", label: "Canada" },
  { code: "GB", dialCode: "+44", flag: "🇬🇧", label: "United Kingdom" },
  { code: "AU", dialCode: "+61", flag: "🇦🇺", label: "Australia" },
  { code: "DE", dialCode: "+49", flag: "🇩🇪", label: "Germany" },
  { code: "FR", dialCode: "+33", flag: "🇫🇷", label: "France" },
  { code: "IN", dialCode: "+91", flag: "🇮🇳", label: "India" },
  { code: "JP", dialCode: "+81", flag: "🇯🇵", label: "Japan" },
  { code: "BR", dialCode: "+55", flag: "🇧🇷", label: "Brazil" },
  { code: "MX", dialCode: "+52", flag: "🇲🇽", label: "Mexico" }
];

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
  const [country, setCountry] = useState<Country>("US");
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (mode === "signup") {
      if (!identifier.trim() || !password || !username.trim() || !firstName.trim() || !lastName.trim()) {
        setError("Email, username, first name, last name, and password are required.");
        setLoading(false);
        return;
      }

      if (!phoneNumber) {
        setError("Please enter a phone number.");
        setLoading(false);
        return;
      }

      if (!isValidPhoneNumber(phoneNumber)) {
        setError("Please enter a valid international phone number.");
        setLoading(false);
        return;
      }
    }

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(
          mode === "login"
            ? { identifier: identifier.trim(), password }
            : {
                email: identifier.trim(),
                password,
                username: username.trim(),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                // `react-phone-number-input` returns phone values in E.164 format (example: +15551234567).
                // Supabase phone auth expects E.164 so each number includes country code and has one canonical format.
                phone: phoneNumber
              }
        )
      });

      if (!response.ok) {
        setError(await getErrorMessage(response));
        return;
      }

      if (mode === "signup") {
        setSuccess("Signup successful. Verify your email and complete phone/code verification if Supabase prompts you.");
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
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr]">
            <div>
              <label className="mb-1 block text-sm text-slate-600">Country</label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                value={country}
                onChange={(e) => setCountry(e.target.value as Country)}
              >
                {COUNTRY_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.flag} {option.label} ({option.dialCode})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Phone number</label>
              {/*
                Country selection controls the dialing code used by the phone input.
                The stored `phoneNumber` value is still E.164, regardless of how the user types locally.
              */}
              <PhoneInput
                country={country}
                international
                withCountryCallingCode
                value={phoneNumber}
                onChange={setPhoneNumber}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Enter phone number"
                required
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
      {success && <p className="text-sm text-emerald-700">{success}</p>}
      <button className="w-full rounded-lg bg-slate-900 py-2 text-white" disabled={loading} type="submit">
        {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}
