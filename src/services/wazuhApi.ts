// ─────────────────────────────────────────────────────────────────────────────
//  HQG Security SOC Platform – Wazuh / OpenSearch API service
// ─────────────────────────────────────────────────────────────────────────────
//  Required environment variables (.env):
//    VITE_WAZUH_URL       – base URL for API calls.
//                           Use "/api/os" when running through the Vite dev proxy
//                           or a full URL (https://192.168.1.10:9200) in production.
//    VITE_WAZUH_USER      – OpenSearch username  (default: admin)
//    VITE_WAZUH_PASSWORD  – OpenSearch password
//
//  Optional:
//    VITE_WAZUH_TIMEOUT_MS – request timeout in ms (default: 12000)
//    VITE_WAZUH_ALERTS_SIZE – default alert list size (default: 500)

const BASE_URL = (import.meta.env.VITE_WAZUH_URL as string) ?? "/api/os";
const USER     = (import.meta.env.VITE_WAZUH_USER as string) ?? "admin";
const PASS     = (import.meta.env.VITE_WAZUH_PASSWORD as string) ?? "admin";

const SEARCH_URL = `${BASE_URL}/wazuh-alerts-*/_search`;

const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_WAZUH_TIMEOUT_MS ?? 12_000);
const DEFAULT_ALERTS_SIZE = Number(import.meta.env.VITE_WAZUH_ALERTS_SIZE ?? 500);

const ALERT_SOURCE_FIELDS = [
  "@timestamp",
  "rule.level",
  "rule.id",
  "rule.description",
  "rule.mitre.id",
  "rule.mitre.tactic",
  "rule.mitre.technique",
  "rule.groups",
  "data.srcip",
  "data.src_ip",
  "data.dstip",
  "data.dest_ip",
  "data.destip",
  "data.protocol",
  "agent.name",
  "agent.ip",
];

const ATTACK_MAP_SOURCE_FIELDS = [
  "@timestamp",
  "timestamp",
  "rule.level",
  "rule.description",
  "data.srcip",
  "data.src_ip",
  "agent.name",
  "agent.ip",
  "geo.country",
  "GeoLocation.country_name",
];

// ── Exported types ────────────────────────────────────────────────────────────

export interface WazuhAlertDisplay {
  id: string;
  timestamp: string;      // "DD/MM/YYYY HH:MM:SS" – ready to display
  level: number;
  ruleId: string;
  description: string;
  agent: string;
  srcIp: string;          // data.srcip  – empty string when absent
  destIp: string;         // data.dstip  – empty string when absent
  protocol: string;       // data.protocol
  mitreIds: string[];     // rule.mitre.id  (may be empty)
  mitreTactics: string[]; // rule.mitre.tactic
  mitreTechniques: string[];
  ruleGroups: string[];   // rule.groups (for identifying active-response etc.)
}

export interface TopAttacker {
  ip: string;
  hits: number;
  reason: string;   // most common rule description for this IP
  source: string;   // "Wazuh" | "Wazuh/FW"
}

export interface MitreEntry {
  tactic: string;
  techniques: { id: string; name: string; count: number }[];
}

export interface MitreMatrixTechnique {
  id: string;
  tactic: string;
  alertCount: number;
  maxSeverity: number;
  topHost: string;
}

export interface MitreMatrixTactic {
  tactic: string;
  totalAlerts: number;
  techniques: MitreMatrixTechnique[];
}

export interface MitreStatItem {
  label: string;
  count: number;
}

export interface MitreAttackChainEvent {
  tactic: string;
  techniqueId: string;
  timestamp: string;
  level: number;
  host: string;
  srcIp: string;
  description: string;
}

export interface MitreOverviewData {
  tactics: MitreMatrixTactic[];
  totalDetections: number;
  topTechniques: MitreMatrixTechnique[];
  topTactics: MitreStatItem[];
  topHosts: MitreStatItem[];
  recentChain: MitreAttackChainEvent[];
}

export interface MitreTechniqueTimelinePoint {
  time: string;
  alerts: number;
  maxSeverity: number;
}

export interface MitreTechniqueAlert {
  id: string;
  timestamp: string;
  level: number;
  description: string;
  srcIp: string;
  agent: string;
  tactic: string;
}

export interface MitreTechniqueDetail {
  techniqueId: string;
  tactic: string;
  totalAlerts: number;
  maxSeverity: number;
  topAttackerIp: string;
  affectedHostCount: number;
  affectedHosts: MitreStatItem[];
  recentAlerts: MitreTechniqueAlert[];
  timeline: MitreTechniqueTimelinePoint[];
}

export interface AttackTimelinePoint {
  time: string;     // "HH:MM" label for the chart
  suricata: number; // network / IDS alerts (have data.srcip)
  wazuh: number;    // all Wazuh alerts in that bucket
  blocked: number;  // critical-severity alerts (level >= 10)
}

export interface KpiData {
  activeAttacks: number;   // level >= 10 in the last hour
  topAttackerIp: string;
  topAttackerHits: number;
  blockedIps: number;      // distinct source IPs in the last 24h
  totalAlerts: number;
  criticalAlerts: number;  // level >= 12
}

export interface GeoPoint {
  country: string;  // GeoLocation.country_name
  hits: number;
}

export interface AttackMapAlert {
  id: string;
  timestamp: string;
  rawTimestamp: string;
  country: string;
  srcIp: string;
  description: string;
  level: number;
  agent: string;
}

export interface AttackMapStat {
  label: string;
  count: number;
}

export interface AttackMapSeverityTotals {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface AttackMapData {
  alerts: AttackMapAlert[];
  topCountries: AttackMapStat[];
  attackTypes: AttackMapStat[];
  severity: AttackMapSeverityTotals;
  totalAttacks: number;
}

export interface ThreatIntelEntry {
  ip: string;
  hits: number;
  maxLevel: number;
  topRule: string;
  mitreIds: string[];
  mitreTactics: string[];
  lastSeen: string;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function authHeader(): string {
  return "Basic " + btoa(`${USER}:${PASS}`);
}

async function esPost(body: object, opts?: { timeoutMs?: number }): Promise<any> {
  const controller = new AbortController();
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(SEARCH_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader(),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`OpenSearch ${res.status}: ${res.statusText}`);
    }
    return res.json();
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new Error(`Timeout kết nối OpenSearch (${timeoutMs}ms)`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function fmtDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString("vi-VN");          // DD/MM/YYYY
    const time = d.toLocaleTimeString("vi-VN", { hour12: false }); // HH:MM:SS
    return `${date} ${time}`;
  } catch {
    return iso;
  }
}

function fmtHourLabel(isoOrMs: string | number): string {
  try {
    return new Date(isoOrMs).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return String(isoOrMs);
  }
}

function toArr<T>(v: T | T[] | null | undefined): T[] {
  if (Array.isArray(v)) return v;
  if (v != null) return [v];
  return [];
}

function parseHit(hit: any): WazuhAlertDisplay {
  const s    = hit._source ?? {};
  const rule = s.rule ?? {};
  const mit  = rule.mitre ?? {};
  const data = s.data ?? {};
  const agnt = s.agent ?? {};

  return {
    id:              String(hit._id ?? ""),
    timestamp:       fmtDateTime(s["@timestamp"] ?? s.timestamp ?? ""),
    level:           Number(rule.level ?? 0),
    ruleId:          String(rule.id ?? ""),
    description:     String(rule.description ?? ""),
    agent:           String(agnt.name ?? agnt.ip ?? ""),
    srcIp:           String(data.srcip ?? data.src_ip ?? ""),
    destIp:          String(data.dstip ?? data.dest_ip ?? data.destip ?? ""),
    protocol:        String(data.protocol ?? ""),
    mitreIds:        toArr<string>(mit.id),
    mitreTactics:    toArr<string>(mit.tactic),
    mitreTechniques: toArr<string>(mit.technique),
    ruleGroups:      toArr<string>(rule.groups),
  };
}

function parseMitreChainHit(hit: any): MitreAttackChainEvent {
  const parsed = parseHit(hit);

  return {
    tactic: parsed.mitreTactics[0] ?? "Unclassified",
    techniqueId: parsed.mitreIds[0] ?? "Unknown",
    timestamp: String(hit?._source?.["@timestamp"] ?? hit?._source?.timestamp ?? ""),
    level: parsed.level,
    host: parsed.agent || "Unassigned",
    srcIp: parsed.srcIp || "Unknown",
    description: parsed.description,
  };
}

function parseAttackCountry(source: any): string {
  return String(source?.geo?.country ?? source?.GeoLocation?.country_name ?? "");
}

function parseAttackMapAlert(hit: any): AttackMapAlert {
  const source = hit._source ?? {};
  const data = source.data ?? {};
  const rule = source.rule ?? {};
  const agent = source.agent ?? {};
  const rawTimestamp = String(source["@timestamp"] ?? source.timestamp ?? "");

  return {
    id: String(hit._id ?? ""),
    timestamp: fmtDateTime(rawTimestamp),
    rawTimestamp,
    country: parseAttackCountry(source) || "Unknown",
    srcIp: String(data.srcip ?? data.src_ip ?? "Unknown"),
    description: String(rule.description ?? "Unknown alert"),
    level: Number(rule.level ?? 0),
    agent: String(agent.name ?? agent.ip ?? "SOC Core"),
  };
}

// ── Public API functions ──────────────────────────────────────────────────────

/** All Wazuh alerts from the last 24 hours, sorted newest-first. */
export async function getRecentAlerts(params?: { size?: number }): Promise<WazuhAlertDisplay[]> {
  const size = params?.size ?? DEFAULT_ALERTS_SIZE;

  const data = await esPost({
    size,
    sort: [{ "@timestamp": { order: "desc" } }],
    query: { range: { "@timestamp": { gte: "now-24h" } } },
    _source: ALERT_SOURCE_FIELDS,
  });
  return (data.hits?.hits ?? []).map(parseHit);
}

/** Top source IPs by alert frequency over the last 24 hours. */
export async function getTopAttackers(): Promise<TopAttacker[]> {
  const data = await esPost({
    size: 0,
    query: {
      bool: {
        must: [
          { exists: { field: "data.srcip" } },
          { range: { "@timestamp": { gte: "now-24h" } } },
        ],
      },
    },
    aggs: {
      top_ips: {
        terms: { field: "data.srcip", size: 50 },
        aggs: {
          top_rule: {
            terms: { field: "rule.description", size: 1 },
          },
        },
      },
    },
  });

  return (data.aggregations?.top_ips?.buckets ?? []).map((b: any) => ({
    ip:     String(b.key),
    hits:   Number(b.doc_count),
    reason: String(b.top_rule?.buckets?.[0]?.key ?? "Cảnh báo Wazuh"),
    source: "Wazuh",
  }));
}

/** MITRE ATT&CK technique counts from all alerts in the last 24h. */
export async function getMitreTechniques(params?: { tacticSize?: number; techniqueSize?: number }): Promise<MitreEntry[]> {
  const tacticSize = params?.tacticSize ?? 30;
  const techniqueSize = params?.techniqueSize ?? 80;

  const data = await esPost({
    size: 0,
    query: {
      bool: {
        must: [
          { exists: { field: "rule.mitre.id" } },
          { range: { "@timestamp": { gte: "now-24h" } } },
        ],
      },
    },
    aggs: {
      by_tactic: {
        terms: {
          field: "rule.mitre.tactic",
          size: tacticSize,
          missing: "Không phân loại",
        },
        aggs: {
          by_technique: {
            terms: { field: "rule.mitre.id", size: techniqueSize },
          },
        },
      },
    },
  });

  const buckets = data.aggregations?.by_tactic?.buckets ?? [];
  return buckets.map((b: any) => ({
    tactic: String(b.key ?? "Không phân loại"),
    techniques: (b.by_technique?.buckets ?? [])
      .map((x: any) => ({ id: String(x.key), name: String(x.key), count: Number(x.doc_count ?? 0) }))
      .sort((a: any, c: any) => c.count - a.count),
  }));
}

/** Aggregated MITRE ATT&CK overview for the dedicated matrix page. */
export async function getMitreOverview(): Promise<MitreOverviewData> {
  const data = await esPost({
    size: 0,
    query: {
      bool: {
        must: [
          { exists: { field: "rule.mitre.id" } },
          { range: { "@timestamp": { gte: "now-24h" } } },
        ],
      },
    },
    aggs: {
      by_tactic: {
        terms: {
          field: "rule.mitre.tactic",
          size: 32,
          missing: "Unclassified",
        },
        aggs: {
          by_technique: {
            terms: {
              field: "rule.mitre.id",
              size: 200,
              order: { _count: "desc" },
            },
            aggs: {
              max_level: { max: { field: "rule.level" } },
              top_host: {
                terms: {
                  field: "agent.name",
                  size: 1,
                  missing: "Unassigned",
                },
              },
            },
          },
        },
      },
      top_hosts: {
        terms: {
          field: "agent.name",
          size: 8,
          missing: "Unassigned",
        },
      },
      recent_chain: {
        top_hits: {
          size: 120,
          sort: [{ "@timestamp": { order: "asc" } }],
          _source: [
            "@timestamp",
            "rule.level",
            "rule.description",
            "rule.mitre.id",
            "rule.mitre.tactic",
            "agent.name",
            "data.srcip",
            "data.src_ip",
          ],
        },
      },
    },
  });

  const tacticBuckets = data.aggregations?.by_tactic?.buckets ?? [];
  const tactics: MitreMatrixTactic[] = tacticBuckets.map((bucket: any) => ({
    tactic: String(bucket.key ?? "Unclassified"),
    totalAlerts: Number(bucket.doc_count ?? 0),
    techniques: (bucket.by_technique?.buckets ?? []).map((technique: any) => ({
      id: String(technique.key ?? ""),
      tactic: String(bucket.key ?? "Unclassified"),
      alertCount: Number(technique.doc_count ?? 0),
      maxSeverity: Number(technique.max_level?.value ?? 0),
      topHost: String(technique.top_host?.buckets?.[0]?.key ?? "Unassigned"),
    })),
  }));

  const topTechniques = tactics
    .flatMap((tactic) => tactic.techniques)
    .sort((a, b) => b.alertCount - a.alertCount || b.maxSeverity - a.maxSeverity)
    .slice(0, 8);

  const topTactics = tactics
    .map((tactic) => ({ label: tactic.tactic, count: tactic.totalAlerts }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const topHosts = (data.aggregations?.top_hosts?.buckets ?? []).map((bucket: any) => ({
    label: String(bucket.key ?? "Unassigned"),
    count: Number(bucket.doc_count ?? 0),
  }));

  const recentChain = (data.aggregations?.recent_chain?.hits?.hits ?? []).map(parseMitreChainHit);

  return {
    tactics,
    totalDetections: Number(data.hits?.total?.value ?? data.hits?.total ?? 0),
    topTechniques,
    topTactics,
    topHosts,
    recentChain,
  };
}

/** Detailed view for a single MITRE technique over the last 24h. */
export async function getMitreTechniqueDetail(
  techniqueId: string,
  params?: { recentSize?: number },
): Promise<MitreTechniqueDetail> {
  const recentSize = params?.recentSize ?? 10;

  const data = await esPost({
    size: recentSize,
    sort: [{ "@timestamp": { order: "desc" } }],
    query: {
      bool: {
        must: [
          { term: { "rule.mitre.id": techniqueId } },
          { range: { "@timestamp": { gte: "now-24h" } } },
        ],
      },
    },
    aggs: {
      max_level: { max: { field: "rule.level" } },
      top_tactic: {
        terms: {
          field: "rule.mitre.tactic",
          size: 1,
          missing: "Unclassified",
        },
      },
      top_attacker: {
        terms: {
          field: "data.srcip",
          size: 1,
          missing: "Unknown",
        },
      },
      affected_hosts: {
        terms: {
          field: "agent.name",
          size: 8,
          missing: "Unassigned",
        },
      },
      affected_host_count: {
        cardinality: { field: "agent.name" },
      },
      timeline: {
        date_histogram: {
          field: "@timestamp",
          fixed_interval: "30m",
          min_doc_count: 0,
          extended_bounds: { min: "now-24h", max: "now" },
        },
        aggs: {
          max_level: { max: { field: "rule.level" } },
        },
      },
    },
    _source: ALERT_SOURCE_FIELDS,
  });

  const recentAlerts = (data.hits?.hits ?? []).map((hit: any) => {
    const parsed = parseHit(hit);
    return {
      id: parsed.id,
      timestamp: String(hit?._source?.["@timestamp"] ?? hit?._source?.timestamp ?? ""),
      level: parsed.level,
      description: parsed.description,
      srcIp: parsed.srcIp || "Unknown",
      agent: parsed.agent || "Unassigned",
      tactic: parsed.mitreTactics[0] ?? "Unclassified",
    };
  });

  return {
    techniqueId,
    tactic: String(data.aggregations?.top_tactic?.buckets?.[0]?.key ?? "Unclassified"),
    totalAlerts: Number(data.hits?.total?.value ?? data.hits?.total ?? 0),
    maxSeverity: Number(data.aggregations?.max_level?.value ?? 0),
    topAttackerIp: String(data.aggregations?.top_attacker?.buckets?.[0]?.key ?? "Unknown"),
    affectedHostCount: Number(data.aggregations?.affected_host_count?.value ?? 0),
    affectedHosts: (data.aggregations?.affected_hosts?.buckets ?? []).map((bucket: any) => ({
      label: String(bucket.key ?? "Unassigned"),
      count: Number(bucket.doc_count ?? 0),
    })),
    recentAlerts,
    timeline: (data.aggregations?.timeline?.buckets ?? []).map((bucket: any) => ({
      time: fmtHourLabel(bucket.key_as_string ?? bucket.key),
      alerts: Number(bucket.doc_count ?? 0),
      maxSeverity: Number(bucket.max_level?.value ?? 0),
    })),
  };
}

/** 1-hour bucket histogram for the last 24 hours (24 data points). */
export async function getAttackTimeline(): Promise<AttackTimelinePoint[]> {
  const data = await esPost({
    size: 0,
    query: { range: { "@timestamp": { gte: "now-24h" } } },
    aggs: {
      by_hour: {
        date_histogram: {
          field: "@timestamp",
          calendar_interval: "1h",
          min_doc_count: 0,
          extended_bounds: { min: "now-24h", max: "now" },
        },
        aggs: {
          network_alerts: { filter: { exists:  { field: "data.srcip" } } },
          critical_alerts: { filter: { range: { "rule.level": { gte: 10 } } } },
        },
      },
    },
  });

  return (data.aggregations?.by_hour?.buckets ?? []).map((b: any) => ({
    time:     fmtHourLabel(b.key_as_string ?? b.key),
    suricata: Number(b.network_alerts?.doc_count ?? 0),
    wazuh:    Number(b.doc_count ?? 0),
    blocked:  Number(b.critical_alerts?.doc_count ?? 0),
  }));
}

/** Summary KPI counters for the header cards. */
export async function getKpiData(): Promise<KpiData> {
  const data = await esPost({
    size: 0,
    query: { range: { "@timestamp": { gte: "now-24h" } } },
    aggs: {
      critical_count: {
        filter: { range: { "rule.level": { gte: 12 } } },
      },
      active_attacks: {
        filter: {
          bool: {
            must: [
              { range: { "rule.level":   { gte: 10 } } },
              { range: { "@timestamp": { gte: "now-1h" } } },
            ],
          },
        },
      },
      unique_attacker_ips: {
        cardinality: { field: "data.srcip" },
      },
      top_attacker: {
        filter: { exists: { field: "data.srcip" } },
        aggs: {
          top_ip: { terms: { field: "data.srcip", size: 1 } },
        },
      },
    },
  });

  const aggs      = data.aggregations ?? {};
  const topBucket = aggs.top_attacker?.top_ip?.buckets?.[0];

  return {
    activeAttacks:    Number(aggs.active_attacks?.doc_count ?? 0),
    topAttackerIp:    String(topBucket?.key ?? "—"),
    topAttackerHits:  Number(topBucket?.doc_count ?? 0),
    blockedIps:       Number(aggs.unique_attacker_ips?.value ?? 0),
    totalAlerts:      Number(data.hits?.total?.value ?? 0),
    criticalAlerts:   Number(aggs.critical_count?.doc_count ?? 0),
  };
}

/** All Suricata IDS alerts from the last 24 hours (rule.groups = suricata). */
export async function getSuricataAlerts(params?: { size?: number }): Promise<WazuhAlertDisplay[]> {
  const size = params?.size ?? DEFAULT_ALERTS_SIZE;

  const data = await esPost({
    size,
    sort: [{ "@timestamp": { order: "desc" } }],
    query: {
      bool: {
        must: [
          { term: { "rule.groups": "suricata" } },
          { range: { "@timestamp": { gte: "now-24h" } } },
        ],
      },
    },
    _source: ALERT_SOURCE_FIELDS,
  });
  return (data.hits?.hits ?? []).map(parseHit);
}

/** All IPs blocked by Active Response (firewall-drop) in the last 24h. */
export async function getBlockedIPs(): Promise<TopAttacker[]> {
  const data = await esPost({
    size: 0,
    query: {
      bool: {
        must: [
          { term: { "rule.groups": "firewall-drop" } },
          { exists: { field: "data.srcip" } },
          { range: { "@timestamp": { gte: "now-24h" } } },
        ],
      },
    },
    aggs: {
      blocked_ips: {
        terms: { field: "data.srcip", size: 100 },
        aggs: {
          top_rule: { terms: { field: "rule.description", size: 1 } },
        },
      },
    },
  });

  return (data.aggregations?.blocked_ips?.buckets ?? []).map((b: any) => ({
    ip:     String(b.key),
    hits:   Number(b.doc_count),
    reason: String(b.top_rule?.buckets?.[0]?.key ?? "Active Response block"),
    source: "Wazuh/FW",
  }));
}

/** Geo distribution of attackers over the last 24 hours (all countries). */
export async function getGeoData(): Promise<GeoPoint[]> {
  const data = await esPost({
    size: 0,
    query: {
      bool: {
        must: [
          { exists: { field: "GeoLocation.country_name" } },
          { range: { "@timestamp": { gte: "now-24h" } } },
        ],
      },
    },
    aggs: {
      by_country: {
        terms: { field: "GeoLocation.country_name", size: 100 },
      },
    },
  });

  return (data.aggregations?.by_country?.buckets ?? []).map((b: any) => ({
    country: String(b.key),
    hits:    Number(b.doc_count),
  }));
}

/** Real-time attack-map view with limited live stream plus server-side aggregations. */
export async function getAttackMapData(params?: { streamSize?: number }): Promise<AttackMapData> {
  const streamSize = params?.streamSize ?? 120;

  const data = await esPost({
    size: streamSize,
    sort: [{ "@timestamp": { order: "desc" } }],
    runtime_mappings: {
      attack_country: {
        type: "keyword",
        script: {
          source: "String country = ''; if (params._source.containsKey('geo')) { def geo = params._source['geo']; if (geo != null && geo.containsKey('country') && geo['country'] != null) { country = geo['country']; } } if (country.isEmpty() && params._source.containsKey('GeoLocation')) { def legacy = params._source['GeoLocation']; if (legacy != null && legacy.containsKey('country_name') && legacy['country_name'] != null) { country = legacy['country_name']; } } if (!country.isEmpty()) emit(country);",
        },
      },
    },
    query: {
      bool: {
        must: [
          { range: { "@timestamp": { gte: "now-24h" } } },
          {
            bool: {
              should: [
                { exists: { field: "data.srcip" } },
                { exists: { field: "data.src_ip" } },
              ],
              minimum_should_match: 1,
            },
          },
          {
            bool: {
              should: [
                { exists: { field: "geo.country" } },
                { exists: { field: "GeoLocation.country_name" } },
              ],
              minimum_should_match: 1,
            },
          },
        ],
      },
    },
    aggs: {
      top_countries: {
        terms: {
          field: "attack_country",
          size: 10,
          order: { _count: "desc" },
        },
      },
      attack_types: {
        terms: {
          field: "rule.description",
          size: 6,
          order: { _count: "desc" },
        },
      },
      severity: {
        filters: {
          filters: {
            low: { range: { "rule.level": { lt: 7 } } },
            medium: { range: { "rule.level": { gte: 7, lt: 10 } } },
            high: { range: { "rule.level": { gte: 10, lt: 14 } } },
            critical: { range: { "rule.level": { gte: 14 } } },
          },
        },
      },
    },
    _source: ATTACK_MAP_SOURCE_FIELDS,
  });

  return {
    alerts: (data.hits?.hits ?? []).map(parseAttackMapAlert),
    topCountries: (data.aggregations?.top_countries?.buckets ?? []).map((bucket: any) => ({
      label: String(bucket.key ?? "Unknown"),
      count: Number(bucket.doc_count ?? 0),
    })),
    attackTypes: (data.aggregations?.attack_types?.buckets ?? []).map((bucket: any) => ({
      label: String(bucket.key ?? "Unknown"),
      count: Number(bucket.doc_count ?? 0),
    })),
    severity: {
      low: Number(data.aggregations?.severity?.buckets?.low?.doc_count ?? 0),
      medium: Number(data.aggregations?.severity?.buckets?.medium?.doc_count ?? 0),
      high: Number(data.aggregations?.severity?.buckets?.high?.doc_count ?? 0),
      critical: Number(data.aggregations?.severity?.buckets?.critical?.doc_count ?? 0),
    },
    totalAttacks: Number(data.hits?.total?.value ?? data.hits?.total ?? 0),
  };
}

/** Active Response events (firewall-drop / host-deny / active-response), 24h. */
export async function getActiveResponses(params?: { size?: number; from?: number }): Promise<WazuhAlertDisplay[]> {
  const size = params?.size ?? 500;
  const from = params?.from ?? 0;

  const data = await esPost({
    size,
    from,
    sort: [{ "@timestamp": { order: "desc" } }],
    query: {
      bool: {
        must: [
          { range: { "@timestamp": { gte: "now-24h" } } },
        ],
        should: [
          { term: { "rule.groups": "active-response" } },
          { term: { "rule.groups": "firewall-drop" } },
          { term: { "rule.groups": "host-deny" } },
        ],
        minimum_should_match: 1,
      },
    },
    _source: ALERT_SOURCE_FIELDS,
  });
  return (data.hits?.hits ?? []).map(parseHit);
}

/**
 * Threat intelligence – high-severity source IPs (level >= 8) aggregated
 * with MITRE context, sorted by threat level then hit count.
 */
export async function getThreatIntel(params?: { size?: number }): Promise<ThreatIntelEntry[]> {
  const size = params?.size ?? 200;

  const data = await esPost({
    size: 0,
    query: {
      bool: {
        must: [
          { exists: { field: "data.srcip" } },
          { range: { "@timestamp": { gte: "now-24h" } } },
          { range: { "rule.level": { gte: 8 } } },
        ],
      },
    },
    aggs: {
      by_ip: {
        terms: {
          field: "data.srcip",
          size,
          order: { max_level: "desc" },
        },
        aggs: {
          max_level: { max: { field: "rule.level" } },
          last_seen: { max: { field: "@timestamp" } },
          mitre_ids: { terms: { field: "rule.mitre.id", size: 20 } },
          mitre_tactics: { terms: { field: "rule.mitre.tactic", size: 20 } },
          top_hit: {
            top_hits: {
              size: 1,
              sort: [
                { "rule.level": { order: "desc" } },
                { "@timestamp": { order: "desc" } },
              ],
              _source: ["rule.description"],
            },
          },
        },
      },
    },
  });

  const buckets = data.aggregations?.by_ip?.buckets ?? [];
  return buckets
    .map((b: any) => {
      const top = b.top_hit?.hits?.hits?.[0]?._source;
      return {
        ip:           String(b.key ?? ""),
        hits:         Number(b.doc_count ?? 0),
        maxLevel:     Number(b.max_level?.value ?? 0),
        topRule:      String(top?.rule?.description ?? ""),
        mitreIds:     (b.mitre_ids?.buckets ?? []).map((x: any) => String(x.key)),
        mitreTactics: (b.mitre_tactics?.buckets ?? []).map((x: any) => String(x.key)),
        lastSeen:     fmtDateTime(String(b.last_seen?.value_as_string ?? "")),
      };
    })
    .sort((a: ThreatIntelEntry, b: ThreatIntelEntry) => b.maxLevel - a.maxLevel || b.hits - a.hits);
}
