"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AccountMenuProps {
  userId: string;
  initialName: string;
  initialEmail: string;
  className?: string;
  placement?: "bottom" | "top";
}

function getInitials(name: string, email: string) {
  const cleanedName = name.trim();

  if (cleanedName) {
    return cleanedName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }

  return (email.slice(0, 2) || "U").toUpperCase();
}

function splitName(name: string) {
  const tokens = name.trim().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return { firstName: null, lastName: null };
  }

  if (tokens.length === 1) {
    return { firstName: tokens[0], lastName: null };
  }

  return {
    firstName: tokens[0],
    lastName: tokens.slice(1).join(" ")
  };
}

export function AccountMenu({ userId, initialName, initialEmail, className, placement = "bottom" }: AccountMenuProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [nameInput, setNameInput] = useState(initialName);
  const [emailInput, setEmailInput] = useState(initialEmail);
  const [isSaving, setIsSaving] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const initials = useMemo(() => getInitials(displayName, email), [displayName, email]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const openProfile = () => {
    setIsMenuOpen(false);
    setFormMessage(null);
    setErrorMessage(null);
    setNameInput(displayName);
    setEmailInput(email);
    setIsProfileOpen(true);
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFormMessage(null);
    setErrorMessage(null);

    const supabase = createClient();
    const trimmedName = nameInput.trim();
    const trimmedEmail = emailInput.trim();
    const { firstName, lastName } = splitName(trimmedName);

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          email: trimmedEmail,
          first_name: firstName,
          last_name: lastName
        })
        .eq("id", userId);

      if (profileError) {
        setErrorMessage(profileError.message);
        return;
      }

      const { error: authUpdateError } = await supabase.auth.updateUser({
        email: trimmedEmail,
        data: {
          first_name: firstName,
          last_name: lastName
        }
      });

      if (authUpdateError) {
        setErrorMessage(authUpdateError.message);
        return;
      }

      setDisplayName(trimmedName || "Account");
      setEmail(trimmedEmail);
      setFormMessage("Profile updated successfully.");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        className={`flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-indigo-100 transition hover:bg-white/10 ${className ?? ""}`}
        onClick={() => setIsMenuOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        type="button"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-indigo-400 text-xs font-bold text-[#181a35]">{initials}</span>
        <span className="hidden md:inline">{displayName}</span>
      </button>

      {isMenuOpen && (
        <div
          className={`absolute right-0 z-30 min-w-44 rounded-xl border border-white/15 bg-[#20244a] p-1.5 shadow-[0_16px_40px_rgba(7,10,30,0.5)] ${
            placement === "top" ? "bottom-[calc(100%+0.5rem)]" : "top-[calc(100%+0.5rem)]"
          }`}
          role="menu"
          aria-label="Account options"
        >
          <button
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-indigo-100 transition hover:bg-white/10"
            role="menuitem"
            type="button"
            onClick={openProfile}
          >
            Profile
          </button>
          <button
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-indigo-100 transition hover:bg-white/10"
            role="menuitem"
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}

      {isProfileOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label="Profile settings">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#20244a] p-5 shadow-[0_20px_60px_rgba(5,8,25,0.6)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Profile settings</h3>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-sm text-indigo-200 transition hover:bg-white/10"
                onClick={() => setIsProfileOpen(false)}
              >
                Close
              </button>
            </div>

            <form className="space-y-3" onSubmit={handleProfileSubmit}>
              <label className="block text-sm text-indigo-100">
                Name
                <input
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#171a36] px-3 py-2 text-sm text-indigo-50 outline-none transition focus:border-cyan-300"
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value)}
                  required
                />
              </label>

              <label className="block text-sm text-indigo-100">
                Email
                <input
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#171a36] px-3 py-2 text-sm text-indigo-50 outline-none transition focus:border-cyan-300"
                  type="email"
                  value={emailInput}
                  onChange={(event) => setEmailInput(event.target.value)}
                  required
                />
              </label>

              {formMessage && <p className="text-sm text-emerald-300">{formMessage}</p>}
              {errorMessage && <p className="text-sm text-rose-300">{errorMessage}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="rounded-xl border border-white/15 px-3 py-2 text-sm text-indigo-100 transition hover:bg-white/10"
                  onClick={() => setIsProfileOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-medium text-[#1c1f3e] transition hover:bg-cyan-200 disabled:opacity-70"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
