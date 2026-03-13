import { useState, useEffect, useCallback, useRef } from "react";
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

type WazuhNeeds = Partial<Record<
  | "alerts"
  | "suricataAlerts"
  | "topAttackers"
  | "blockedIPs"
  | "mitreData"
  | "timeline"
  | "kpi"
  | "geoData"
  | "activeResponses"
  | "threatIntel",
  boolean
>>;

type WazuhLimits = Partial<Record<keyof WazuhNeeds, number>>;

export interface UseWazuhDataOptions {
  /** Only fetch the datasets your page needs (reduces load and avoids freezes). */
  needs?: WazuhNeeds;
  /** Per-dataset size limits (reduces payload and avoids UI freezes). */
  limits?: WazuhLimits;
  /** Polling interval in ms; set to false to disable polling. */
  pollMs?: number | false;
}

const ALL_NEEDS: Required<WazuhNeeds> = {
  alerts: true,
  suricataAlerts: true,
  topAttackers: true,
  blockedIPs: true,
  mitreData: true,
  timeline: true,
  kpi: true,
  geoData: true,
  activeResponses: true,
  threatIntel: true,
};

const NO_NEEDS: Required<WazuhNeeds> = {
  alerts: false,
  suricataAlerts: false,
  topAttackers: false,
  blockedIPs: false,
  mitreData: false,
  timeline: false,
  kpi: false,
  geoData: false,
  activeResponses: false,
  threatIntel: false,
};

/**
 * Fetches selected Wazuh / OpenSearch datasets. Use `needs` to avoid heavy queries on pages that don't need them.
 */
export function useWazuhData(opts: UseWazuhDataOptions = {}): WazuhDashboardData {
  const needs: Required<WazuhNeeds> = opts.needs ? { ...NO_NEEDS, ...opts.needs } : ALL_NEEDS;
  const limits = opts.limits ?? {};
  const pollMs = opts.pollMs ?? 10_000;

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

  const inFlight = useRef(false);
  const hasLoadedOnce = useRef(false);

  const fetchAll = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (!hasLoadedOnce.current) setLoading(true);

    const tasks: Array<{ key: keyof WazuhNeeds; run: () => Promise<unknown> }> = [];
    if (needs.alerts)          tasks.push({ key: "alerts",          run: () => getRecentAlerts({ size: limits.alerts }).then(setAlerts) });
    if (needs.suricataAlerts)  tasks.push({ key: "suricataAlerts",  run: () => getSuricataAlerts({ size: limits.suricataAlerts }).then(setSuricataAlerts) });
    if (needs.topAttackers)    tasks.push({ key: "topAttackers",    run: () => getTopAttackers().then(setTopAttackers) });
    if (needs.blockedIPs)      tasks.push({ key: "blockedIPs",      run: () => getBlockedIPs().then(setBlockedIPs) });
    if (needs.mitreData)       tasks.push({ key: "mitreData",       run: () => getMitreTechniques().then(setMitreData) });
    if (needs.timeline)        tasks.push({ key: "timeline",        run: () => getAttackTimeline().then(setTimeline) });
    if (needs.kpi)             tasks.push({ key: "kpi",             run: () => getKpiData().then(setKpi) });
    if (needs.geoData)         tasks.push({ key: "geoData",         run: () => getGeoData().then(setGeoData) });
    if (needs.activeResponses) tasks.push({ key: "activeResponses", run: () => getActiveResponses({ size: limits.activeResponses }).then(setActiveResponses) });
    if (needs.threatIntel)     tasks.push({ key: "threatIntel",     run: () => getThreatIntel({ size: limits.threatIntel }).then(setThreatIntel) });

    try {
      const settled = await Promise.allSettled(tasks.map((t) => t.run()));
      const rejected = settled.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
      setLastUpdated(new Date());
      setError(
        rejected
          ? (rejected.reason instanceof Error ? rejected.reason.message : String(rejected.reason ?? "Lỗi kết nối đến Wazuh Indexer"))
          : null,
      );
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
      inFlight.current = false;
    }
  }, [limits.activeResponses, limits.alerts, limits.suricataAlerts, limits.threatIntel, needs.activeResponses, needs.alerts, needs.blockedIPs, needs.geoData, needs.kpi, needs.mitreData, needs.suricataAlerts, needs.threatIntel, needs.timeline, needs.topAttackers]);

  useEffect(() => {
    fetchAll();
    if (pollMs === false) return;
    const interval = setInterval(fetchAll, pollMs);
    return () => clearInterval(interval);
  }, [fetchAll, pollMs]);

  return {
    alerts, suricataAlerts, topAttackers, blockedIPs,
    mitreData, timeline, kpi, geoData,
    activeResponses, threatIntel,
    loading, error, lastUpdated, refetch: fetchAll,
  };
}
