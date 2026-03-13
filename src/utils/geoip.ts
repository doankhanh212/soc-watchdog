// ─────────────────────────────────────────────────────────────────────────────
//  GeoIP Resolution Module – SOC Attack Map
// ─────────────────────────────────────────────────────────────────────────────
//  Primary source : Wazuh/OpenSearch geo enrichment (geo.country, GeoLocation)
//  Fallback       : ip-api.com batch API (proxied through Vite → /api/geoip)
//
//  Configure via:
//    VITE_GEOIP_API  – base URL for the GeoIP proxy (default: "/api/geoip")
//
//  The module caches all resolved IPs in memory so repeated 30-second polling
//  cycles don't re-hit the API for the same addresses.

export interface GeoIPResult {
  ip: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
}

// ── Configuration ─────────────────────────────────────────────────────────────

const GEOIP_API =
  (import.meta.env.VITE_GEOIP_API as string) || "/api/geoip";

/** ip-api.com free-tier batch limit */
const BATCH_SIZE = 100;

/** Max cached entries before LRU eviction */
const MAX_CACHE = 10_000;

// ── In-memory cache ───────────────────────────────────────────────────────────

const geoCache = new Map<string, GeoIPResult>();

// ── Private-IP detection ──────────────────────────────────────────────────────

const PRIVATE_PATTERNS = [
  /^10\./,
  /^192\.168\./,
  /^127\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

export function isPrivateIP(ip: string): boolean {
  if (!ip || ip === "0.0.0.0" || ip === "::1") return true;
  return PRIVATE_PATTERNS.some((re) => re.test(ip));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Return a cached GeoIP result (or `undefined` if the IP hasn't been resolved). */
export function getCachedGeo(ip: string): GeoIPResult | undefined {
  return geoCache.get(ip);
}

/**
 * Batch-resolve a list of IPs via the configured GeoIP API.
 *
 * Already-cached and private/local addresses are silently skipped.
 * Results are stored in the in-memory cache for subsequent lookups.
 *
 * Errors are swallowed so that a GeoIP outage never blocks the map render.
 */
export async function resolveGeoIPs(ips: string[]): Promise<void> {
  const unique = [...new Set(ips)].filter(
    (ip) => ip && !isPrivateIP(ip) && !geoCache.has(ip),
  );
  if (unique.length === 0) return;

  for (const batch of chunk(unique, BATCH_SIZE)) {
    try {
      const res = await fetch(`${GEOIP_API}/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          batch.map((ip) => ({
            query: ip,
            fields: "status,country,countryCode,lat,lon,query",
          })),
        ),
      });

      if (!res.ok) continue;

      const data: any[] = await res.json();
      for (const entry of data) {
        if (entry?.status === "success" && entry.query) {
          geoCache.set(entry.query, {
            ip: entry.query,
            country: entry.country ?? "Unknown",
            countryCode: entry.countryCode ?? "",
            lat: Number(entry.lat ?? 0),
            lon: Number(entry.lon ?? 0),
          });
        }
      }
    } catch {
      // GeoIP API unavailable — alerts will remain without coordinates.
    }
  }

  // LRU eviction: drop oldest entries when the cache is oversized.
  while (geoCache.size > MAX_CACHE) {
    const first = geoCache.keys().next().value;
    if (first) geoCache.delete(first);
    else break;
  }
}
