import { getAttackMapData } from "@/services/wazuhApi";
import { getCachedGeo, resolveGeoIPs } from "@/utils/geoip";
import { useQuery } from "@tanstack/react-query";

export function useAttackMapInsights() {
  const query = useQuery({
    queryKey: ["attack-map-insights"],
    queryFn: async () => {
      const data = await getAttackMapData({ streamSize: 200 });

      // ── GeoIP enrichment for alerts lacking country data ────────────────
      const unresolvedIps = data.alerts
        .filter((a) => !a.country && a.srcIp)
        .map((a) => a.srcIp);

      if (unresolvedIps.length > 0) {
        await resolveGeoIPs(unresolvedIps);

        for (const alert of data.alerts) {
          if (!alert.country && alert.srcIp) {
            const geo = getCachedGeo(alert.srcIp);
            if (geo) {
              alert.country = geo.country;
              alert.coords = [geo.lon, geo.lat];
            }
          }
        }
      }

      return data;
    },
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  });

  return {
    data: query.data,
    loading: query.isLoading,
    refreshing: query.isFetching && !query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    lastUpdated: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null,
  };
}