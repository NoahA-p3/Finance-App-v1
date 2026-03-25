const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeBaseUrl(value: string | undefined | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const normalized = trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;
    const parsed = new URL(normalized);

    return parsed.origin;
  } catch {
    return null;
  }
}

export function resolveSiteUrl(req: Request) {
  const configuredSiteUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL);

  if (configuredSiteUrl) {
    return configuredSiteUrl;
  }

  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    const protocol = forwardedProto === "http" || forwardedProto === "https" ? forwardedProto : "https";
    const derived = normalizeBaseUrl(`${protocol}://${forwardedHost}`);

    if (derived) {
      return derived;
    }
  }

  return normalizeBaseUrl(req.url) ?? null;
}

export function resolveAuthRedirectUrl(req: Request, pathname: string) {
  const siteUrl = resolveSiteUrl(req);

  if (!siteUrl) {
    return null;
  }

  return `${siteUrl}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
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
