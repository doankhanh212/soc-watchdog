import { useQuery } from "@tanstack/react-query";
import { fetchWazuhAlerts, fetchWazuhAgents } from "@/api/wazuhApi";

export function useWazuhAlerts(levelMin = 3) {
  return useQuery({
    queryKey: ["wazuh-alerts", levelMin],
    queryFn: () => fetchWazuhAlerts({ level_min: levelMin }),
    refetchInterval: 30_000,
    retry: 1,
  });
}

export function useWazuhAgents() {
  return useQuery({
    queryKey: ["wazuh-agents"],
    queryFn: fetchWazuhAgents,
    refetchInterval: 60_000,
    retry: 1,
  });
}
