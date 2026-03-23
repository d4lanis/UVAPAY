const FALLBACK_API_URL = "http://localhost:4000";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizeConfiguredApiUrl(value: string): string {
  const configured = trimTrailingSlash(value.trim());

  if (typeof window !== "undefined" && window.location.protocol === "https:" && configured.startsWith("http://")) {
    return `https://${configured.slice("http://".length)}`;
  }

  return configured;
}

export function resolveApiUrl(): string {
  const configured = import.meta.env.VITE_API_URL;
  if (configured && configured.trim()) {
    return normalizeConfiguredApiUrl(configured);
  }

  if (typeof window !== "undefined") {
    return trimTrailingSlash(window.location.origin);
  }

  return FALLBACK_API_URL;
}

export const API_URL = resolveApiUrl();