"use client";

import { useMemo, useState } from "react";
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState<Country>("US");
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>(undefined);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const passwordStrength = useMemo(() => {
    if (!password) {
      return { label: "", score: 0 };
    }

    const rules = [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)];
    const score = rules.filter(Boolean).length;

    if (score <= 1) {
      return { label: "Weak", score };
    }

    if (score <= 3) {
      return { label: "Fair", score };
    }

    return { label: "Strong", score };
  }, [password]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!identifier.trim()) {
      nextErrors.identifier = mode === "login" ? "Enter your email or username." : "Email is required.";
    }

    if (mode === "signup" && identifier.trim() && !EMAIL_PATTERN.test(identifier.trim())) {
      nextErrors.identifier = "Please enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    } else if (mode === "signup" && password.length < 8) {
      nextErrors.password = "Use at least 8 characters for better security.";
    }

    if (mode === "signup") {
      if (!confirmPassword) {
        nextErrors.confirmPassword = "Please confirm your password.";
      } else if (confirmPassword !== password) {
        nextErrors.confirmPassword = "Passwords do not match.";
      }

      if (!username.trim()) {
        nextErrors.username = "Username is required.";
      }

      if (!firstName.trim()) {
        nextErrors.firstName = "First name is required.";
      }

      if (!lastName.trim()) {
        nextErrors.lastName = "Last name is required.";
      }

      if (!phoneNumber) {
        nextErrors.phone = "Please enter your phone number.";
      } else if (!isValidPhoneNumber(phoneNumber)) {
        nextErrors.phone = "Enter a valid international phone number.";
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validate()) {
      return;
    }

    setLoading(true);

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
                phone: phoneNumber
              }
        )
      });

      if (!response.ok) {
        setError(await getErrorMessage(response));
        return;
      }

      if (mode === "signup") {
        setSuccess("Account created successfully. Verify your email to continue.");
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

  const inputBase =
    "w-full rounded-xl border bg-white/70 px-3 py-2.5 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 dark:bg-slate-900/60 dark:text-slate-100";

  const inputClass = (fieldName: string) =>
    `${inputBase} ${fieldErrors[fieldName]
      ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 dark:focus:ring-rose-900/40"
      : "border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:focus:ring-indigo-900/30"}`;

  return (
    <form
      className="w-full space-y-5 rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-md transition-all duration-300 dark:border-slate-700 dark:bg-slate-950/80"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {mode === "login"
            ? "Sign in to track your finances with confidence."
            : "Get started with a secure account in under a minute."}
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {mode === "login" ? "Email or Username" : "Email"}
        </label>
        <input
          className={inputClass("identifier")}
          type={mode === "login" ? "text" : "email"}
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            setFieldErrors((prev) => ({ ...prev, identifier: "" }));
          }}
          placeholder={mode === "login" ? "name@email.com or username" : "name@email.com"}
          required
        />
        {fieldErrors.identifier && <p className="mt-1 text-xs text-rose-600">{fieldErrors.identifier}</p>}
      </div>

      {mode === "signup" && (
        <>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
            <input
              className={inputClass("username")}
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setFieldErrors((prev) => ({ ...prev, username: "" }));
              }}
              placeholder="Choose a unique username"
              required
            />
            {fieldErrors.username && <p className="mt-1 text-xs text-rose-600">{fieldErrors.username}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">First name</label>
              <input
                className={inputClass("firstName")}
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, firstName: "" }));
                }}
                placeholder="First name"
                required
              />
              {fieldErrors.firstName && <p className="mt-1 text-xs text-rose-600">{fieldErrors.firstName}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Last name</label>
              <input
                className={inputClass("lastName")}
                type="text"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, lastName: "" }));
                }}
                placeholder="Last name"
                required
              />
              {fieldErrors.lastName && <p className="mt-1 text-xs text-rose-600">{fieldErrors.lastName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr]">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Country</label>
              <select
                className={inputClass("country")}
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
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone number</label>
              <PhoneInput
                country={country}
                international
                withCountryCallingCode
                value={phoneNumber}
                onChange={(value) => {
                  setPhoneNumber(value);
                  setFieldErrors((prev) => ({ ...prev, phone: "" }));
                }}
                className={inputClass("phone")}
                placeholder="+1 555 123 4567"
                required
              />
              {fieldErrors.phone && <p className="mt-1 text-xs text-rose-600">{fieldErrors.phone}</p>}
            </div>
          </div>
        </>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
        <div className="relative">
          <input
            className={`${inputClass("password")} pr-16`}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((prev) => ({ ...prev, password: "" }));
            }}
            placeholder="Enter your password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {mode === "signup" && password && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Strength: <span className="font-semibold">{passwordStrength.label}</span>
          </p>
        )}
        {fieldErrors.password && <p className="mt-1 text-xs text-rose-600">{fieldErrors.password}</p>}
      </div>

      {mode === "signup" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm password</label>
          <div className="relative">
            <input
              className={`${inputClass("confirmPassword")} pr-16`}
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }}
              placeholder="Re-enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400"
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
          {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-rose-600">{fieldErrors.confirmPassword}</p>}
        </div>
      )}

      <div className="space-y-2">
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
        {success && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {success}
          </p>
        )}
      </div>

      <button
        className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus:ring-indigo-900"
        disabled={loading}
        type="submit"
      >
        {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}
