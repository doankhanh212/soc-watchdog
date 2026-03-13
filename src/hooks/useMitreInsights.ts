import { fetchMitreAttackData } from "@/api/mitreApi";
import {
  getMitreOverview,
  getMitreTechniqueDetail,
  type MitreMatrixTechnique,
  type MitreStatItem,
} from "@/services/wazuhApi";
import {
  buildMitreCatalogMap,
  deriveAttackChain,
  enrichMitreTactics,
  resolveMitreTacticLabel,
} from "@/utils/mitre";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

export function useMitreInsights() {
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string | null>(null);

  const overviewQuery = useQuery({
    queryKey: ["mitre-overview"],
    queryFn: getMitreOverview,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  });

  const catalogQuery = useQuery({
    queryKey: ["mitre-catalog"],
    queryFn: fetchMitreAttackData,
    staleTime: 1000 * 60 * 60 * 12,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });

  const catalogMap = useMemo(
    () => buildMitreCatalogMap(catalogQuery.data ?? []),
    [catalogQuery.data],
  );

  const tactics = useMemo(
    () => enrichMitreTactics(overviewQuery.data?.tactics ?? [], catalogMap),
    [catalogMap, overviewQuery.data?.tactics],
  );

  const topTechniques = useMemo(() => {
    return (overviewQuery.data?.topTechniques ?? []).map((technique: MitreMatrixTechnique) => {
      const metadata = catalogMap.get(technique.id);
      return {
        ...technique,
        tactic: resolveMitreTacticLabel(technique.tactic),
        name: metadata?.name ?? technique.id,
      };
    });
  }, [catalogMap, overviewQuery.data?.topTechniques]);

  const topTactics = useMemo(() => {
    return (overviewQuery.data?.topTactics ?? []).map((item: MitreStatItem) => ({
      ...item,
      label: resolveMitreTacticLabel(item.label),
    }));
  }, [overviewQuery.data?.topTactics]);

  const attackChain = useMemo(
    () => deriveAttackChain(overviewQuery.data?.recentChain ?? [], catalogMap),
    [catalogMap, overviewQuery.data?.recentChain],
  );

  const detailQuery = useQuery({
    queryKey: ["mitre-technique-detail", selectedTechniqueId],
    queryFn: () => getMitreTechniqueDetail(selectedTechniqueId as string),
    enabled: Boolean(selectedTechniqueId),
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  });

  const selectedTechnique = useMemo(() => {
    if (!selectedTechniqueId) return null;

    for (const tactic of tactics) {
      const found = tactic.techniques.find((technique) => technique.id === selectedTechniqueId);
      if (found) return found;
    }

    return null;
  }, [selectedTechniqueId, tactics]);

  const error = overviewQuery.error instanceof Error
    ? overviewQuery.error.message
    : detailQuery.error instanceof Error
      ? detailQuery.error.message
      : null;

  return {
    tactics,
    topTechniques,
    topTactics,
    topHosts: overviewQuery.data?.topHosts ?? [],
    totalDetections: overviewQuery.data?.totalDetections ?? 0,
    attackChain,
    selectedTechniqueId,
    selectedTechnique,
    setSelectedTechniqueId,
    detail: detailQuery.data ?? null,
    loading: overviewQuery.isLoading,
    detailLoading: detailQuery.isFetching,
    refreshing: overviewQuery.isFetching && !overviewQuery.isLoading,
    lastUpdated: overviewQuery.dataUpdatedAt ? new Date(overviewQuery.dataUpdatedAt) : null,
    error,
  };
}