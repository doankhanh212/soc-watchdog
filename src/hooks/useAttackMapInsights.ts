import { getAttackMapData } from "@/services/wazuhApi";
import { useQuery } from "@tanstack/react-query";

export function useAttackMapInsights() {
  const query = useQuery({
    queryKey: ["attack-map-insights"],
    queryFn: () => getAttackMapData({ streamSize: 120 }),
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