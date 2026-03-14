// ─────────────────────────────────────────────────────────────────────────────
//  Security SOC Platform – Geo Attack Map Page Hook
// ─────────────────────────────────────────────────────────────────────────────
//  Fetches Wazuh alerts + AI anomaly events, resolves source IPs to geographic
//  coordinates via the GeoIP module, and returns enriched event data for the
//  "Bản đồ tấn công địa lý" page.
//
//  • Polls every 30 seconds (refetchInterval).
//  • AI anomaly data degrades gracefully to [] if index is unavailable.

import { useQuery } from "@tanstack/react-query";
import {
  getAttackGeoRawEvents,
  getAiAnomalyEvents,
} from "@/services/wazuhApi";
import { getCachedGeo, isPrivateIP, resolveGeoIPs } from "@/utils/geoip";

// ── Exported types ────────────────────────────────────────────────────────────

export interface GeoAttackEvent {
  id:          string;
  timestamp:   string;
  srcIp:       string;
  country:     string;
  countryCode: string;   // lowercase ISO-2  e.g. "cn"
  lat:         number;
  lon:         number;
  description: string;
  level:       number;
  isAI:        boolean;
  riskScore:   number;
}

export interface CountryAttackStat {
  country:     string;
  countryCode: string;   // lowercase ISO-2
  attacks:     number;
  percentage:  number;
}

export interface GeoAttackPageData {
  events:       GeoAttackEvent[];
  countryStats: CountryAttackStat[];
  totalAttacks: number;
  aiTotal:      number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function aiSeverityToLevel(severity: string): number {
  switch (severity.toLowerCase()) {
    case "critical": return 15;
    case "high":     return 12;
    case "medium":   return 8;
    default:         return 4;
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useGeoAttackPage() {
  const query = useQuery({
    queryKey: ["geo-attack-page"],
    queryFn: async (): Promise<GeoAttackPageData> => {
      // Fetch Wazuh & AI sources in parallel; AI failure → empty array
      const [rawEvents, aiEvents] = await Promise.all([
        getAttackGeoRawEvents({ size: 500 }),
        getAiAnomalyEvents({ size: 200 }),
      ]);

      // Resolve all unique public IPs to lat/lon in one batch call
      const allIps = [
        ...rawEvents.map((e) => e.srcIp),
        ...aiEvents.map((e) => e.srcIp),
      ].filter((ip) => !!ip && !isPrivateIP(ip));

      await resolveGeoIPs(allIps);

      // Build enriched event list for Wazuh alerts
      const events: GeoAttackEvent[] = [];

      for (const e of rawEvents) {
        if (isPrivateIP(e.srcIp)) continue;
        const geo = getCachedGeo(e.srcIp);
        if (!geo) continue;

        events.push({
          id:          e.id,
          timestamp:   e.timestamp,
          srcIp:       e.srcIp,
          country:     geo.country,
          countryCode: geo.countryCode.toLowerCase(),
          lat:         geo.lat,
          lon:         geo.lon,
          description: e.description,
          level:       e.level,
          isAI:        false,
          riskScore:   0,
        });
      }

      // Append AI anomaly events
      for (const e of aiEvents) {
        if (isPrivateIP(e.srcIp)) continue;
        const geo = getCachedGeo(e.srcIp);
        if (!geo) continue;

        events.push({
          id:          e.id,
          timestamp:   e.timestamp,
          srcIp:       e.srcIp,
          country:     geo.country,
          countryCode: geo.countryCode.toLowerCase(),
          lat:         geo.lat,
          lon:         geo.lon,
          description: `AI Phát hiện bất thường (risk: ${e.riskScore})`,
          level:       aiSeverityToLevel(e.severity),
          isAI:        true,
          riskScore:   e.riskScore,
        });
      }

      // Aggregate events per country for the top-origins table
      const countryMap = new Map<string, { attacks: number; countryCode: string }>();
      for (const e of events) {
        if (!e.country) continue;
        const existing = countryMap.get(e.country);
        if (existing) {
          existing.attacks += 1;
        } else {
          countryMap.set(e.country, { attacks: 1, countryCode: e.countryCode });
        }
      }

      const totalAttacks = events.length;

      const countryStats: CountryAttackStat[] = [...countryMap.entries()]
        .map(([country, { attacks, countryCode }]) => ({
          country,
          countryCode,
          attacks,
          percentage:
            totalAttacks > 0 ? Math.round((attacks / totalAttacks) * 100) : 0,
        }))
        .sort((a, b) => b.attacks - a.attacks)
        .slice(0, 20);

      return {
        events,
        countryStats,
        totalAttacks,
        aiTotal: events.filter((e) => e.isAI).length,
      };
    },
    refetchInterval:              30_000,
    refetchIntervalInBackground:  true,
  });

  return {
    data:        query.data,
    loading:     query.isLoading,
    refreshing:  query.isFetching && !query.isLoading,
    error:       query.error instanceof Error ? query.error.message : null,
    lastUpdated: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null,
  };
}
