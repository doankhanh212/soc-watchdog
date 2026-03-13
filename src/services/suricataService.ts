import { useQuery } from "@tanstack/react-query";
import { fetchSuricataAlerts } from "@/api/suricataApi";

export function useSuricataAlerts() {
  return useQuery({
    queryKey: ["suricata-alerts"],
    queryFn: fetchSuricataAlerts,
    refetchInterval: 15_000,
    retry: 1,
  });
}
