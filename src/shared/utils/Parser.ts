// ============================================================
// Image Parser Utility
// ============================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const API_URL = API_BASE_URL.replace(/\/$/, "");

const PLACEHOLDER = "/images/placeholder-product.png";

/**
 * Resolves any media path/URL
 */
export function resolveMediaUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  const raw = url.trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) return raw;

  if (raw.startsWith("/")) {
    return `${API_URL}${raw.replace(/\/Store\//g, "/stores/")}`;
  }

  return `${API_URL}/${raw}`;
}