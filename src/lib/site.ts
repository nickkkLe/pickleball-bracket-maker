import { headers } from "next/headers";

/** Absolute site origin (no trailing slash), for building URLs that must be
 * fully-qualified — e.g. a QR code, which is useless if it encodes a
 * relative path. Prefers NEXT_PUBLIC_SITE_URL; falls back to the current
 * request's own host so this still works correctly in local dev. */
export async function getSiteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("host");
  if (!host) return "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}
