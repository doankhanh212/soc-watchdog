import { useState, useEffect, useCallback } from "react";
import {
  getRecentAlerts,
  getTopAttackers,
  getMitreTechniques,
  getAttackTimeline,
  getKpiData,
  getSuricataAlerts,
  getBlockedIPs,
  getGeoData,
  getActiveResponses,
  getThreatIntel,
  type WazuhAlertDisplay,
  type TopAttacker,
  type MitreEntry,
  type AttackTimelinePoint,
  type KpiData,
  type GeoPoint,
  type ThreatIntelEntry,
} from "@/services/wazuhApi";

export interface WazuhDashboardData {
  alerts:           WazuhAlertDisplay[];
  suricataAlerts:   WazuhAlertDisplay[];
  topAttackers:     TopAttacker[];
  blockedIPs:       TopAttacker[];
  mitreData:        MitreEntry[];
  timeline:         AttackTimelinePoint[];
  kpi:              KpiData | null;
  geoData:          GeoPoint[];
  activeResponses:  WazuhAlertDisplay[];
  threatIntel:      ThreatIntelEntry[];
  loading:          boolean;
  error:            string | null;
  lastUpdated:      Date | null;
  refetch:          () => void;
}

/**
 * Fetches all Wazuh dashboard data and refreshes every 10 seconds.
 * Mount this hook once per page; components receive slices as props.
 */
export function useWazuhData(): WazuhDashboardData {
  const [alerts,           setAlerts]           = useState<WazuhAlertDisplay[]>([]);
  const [suricataAlerts,   setSuricataAlerts]   = useState<WazuhAlertDisplay[]>([]);
  const [topAttackers,     setTopAttackers]     = useState<TopAttacker[]>([]);
  const [blockedIPs,       setBlockedIPs]       = useState<TopAttacker[]>([]);
  const [mitreData,        setMitreData]        = useState<MitreEntry[]>([]);
  const [timeline,         setTimeline]         = useState<AttackTimelinePoint[]>([]);
  const [kpi,              setKpi]              = useState<KpiData | null>(null);
  const [geoData,          setGeoData]          = useState<GeoPoint[]>([]);
  const [activeResponses,  setActiveResponses]  = useState<WazuhAlertDisplay[]>([]);
  const [threatIntel,      setThreatIntel]      = useState<ThreatIntelEntry[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState<string | null>(null);
  const [lastUpdated,      setLastUpdated]      = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [
        alertsData, suricata, attackers, blocked,
        mitre, tl, kpiData, geo, arData, tiData,
      ] = await Promise.all([
        getRecentAlerts(),
        getSuricataAlerts(),
        getTopAttackers(),
        getBlockedIPs(),
        getMitreTechniques(),
        getAttackTimeline(),
        getKpiData(),
        getGeoData(),
        getActiveResponses(),
        getThreatIntel(),
      ]);
      setAlerts(alertsData);
      setSuricataAlerts(suricata);
      setTopAttackers(attackers);
      setBlockedIPs(blocked);
      setMitreData(mitre);
      setTimeline(tl);
      setKpi(kpiData);
      setGeoData(geo);
      setActiveResponses(arData);
      setThreatIntel(tiData);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Lỗi kết nối đến Wazuh Indexer"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return {
    alerts, suricataAlerts, topAttackers, blockedIPs,
    mitreData, timeline, kpi, geoData,
    activeResponses, threatIntel,
    loading, error, lastUpdated, refetch: fetchAll,
  };
}
