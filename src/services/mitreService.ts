import { useQuery } from "@tanstack/react-query";
import { fetchMitreAttackData } from "@/api/mitreApi";

export function useMitreData() {
  return useQuery({
    queryKey: ["mitre-attack"],
    queryFn: fetchMitreAttackData,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 2,
  });
}
