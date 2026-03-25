const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function resolveSiteUrl(requestUrl: string) {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredSiteUrl) {
    return configuredSiteUrl.replace(/\/$/, "");
  }

  return new URL(requestUrl).origin;
}

export async function readJsonObject(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const payload = await req.json();

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return null;
    }

    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function normalizeEmail(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();

  if (!email || !EMAIL_PATTERN.test(email)) {
    return null;
  }

  return email;
}

export function normalizePassword(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const password = value.trim();

  if (!password || password.length < 8) {
    return null;
  }

  return password;
}

export function isPasswordResetEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_PASSWORD_RESET !== "false";
}
