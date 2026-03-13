// ─────────────────────────────────────────────────────────────────────────────
//  HQG Security SOC Platform – Wazuh / OpenSearch API service
// ─────────────────────────────────────────────────────────────────────────────
//  Required environment variables (.env):
//    VITE_WAZUH_URL       – base URL for API calls.
//                           Use "/api/os" when running through the Vite dev proxy
//                           or a full URL (https://192.168.1.10:9200) in production.
//    VITE_WAZUH_USER      – OpenSearch username  (default: admin)
//    VITE_WAZUH_PASSWORD  – OpenSearch password

const BASE_URL = (import.meta.env.VITE_WAZUH_URL as string) ?? "/api/os";
const USER     = (import.meta.env.VITE_WAZUH_USER as string) ?? "admin";
const PASS     = (import.meta.env.VITE_WAZUH_PASSWORD as string) ?? "admin";

const SEARCH_URL = `${BASE_URL}/wazuh-alerts-*/_search`;

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

async function esPost(body: object): Promise<any> {
  const res = await fetch(SEARCH_URL, {
    method: "POST",
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

// ── Public API functions ──────────────────────────────────────────────────────

/** All Wazuh alerts from the last 24 hours, sorted newest-first. */
export async function getRecentAlerts(): Promise<WazuhAlertDisplay[]> {
  const data = await esPost({
    size: 10000,
    sort: [{ "@timestamp": { order: "desc" } }],
    query: { range: { "@timestamp": { gte: "now-24h" } } },
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
export async function getMitreTechniques(): Promise<MitreEntry[]> {
  const data = await esPost({
    size: 10000,
    query: {
      bool: {
        must: [
          { exists: { field: "rule.mitre.id" } },
          { range: { "@timestamp": { gte: "now-24h" } } },
        ],
      },
    },
    _source: ["rule.mitre"],
  });

  const tacticMap = new Map<string, Map<string, number>>();

  for (const hit of data.hits?.hits ?? []) {
    const mit  = hit._source?.rule?.mitre ?? {};
    const ids: string[]    = toArr<string>(mit.id);
    const tactics: string[] = toArr<string>(mit.tactic);
    const tactic = tactics[0] ?? "Không phân loại";

    if (!tacticMap.has(tactic)) tacticMap.set(tactic, new Map());
    const tm = tacticMap.get(tactic)!;
    for (const id of ids) tm.set(id, (tm.get(id) ?? 0) + 1);
  }

  return Array.from(tacticMap.entries()).map(([tactic, techniques]) => ({
    tactic,
    techniques: Array.from(techniques.entries())
      .map(([id, count]) => ({ id, name: id, count }))
      .sort((a, b) => b.count - a.count),
  }));
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
export async function getSuricataAlerts(): Promise<WazuhAlertDisplay[]> {
  const data = await esPost({
    size: 10000,
    sort: [{ "@timestamp": { order: "desc" } }],
    query: {
      bool: {
        must: [
          { term: { "rule.groups": "suricata" } },
          { range: { "@timestamp": { gte: "now-24h" } } },
        ],
      },
    },
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

/** Active Response events (firewall-drop / host-deny / active-response), 24h. */
export async function getActiveResponses(): Promise<WazuhAlertDisplay[]> {
  const data = await esPost({
    size: 10000,
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
  });
  return (data.hits?.hits ?? []).map(parseHit);
}

/**
 * Threat intelligence – high-severity source IPs (level >= 8) aggregated
 * with MITRE context, sorted by threat level then hit count.
 */
export async function getThreatIntel(): Promise<ThreatIntelEntry[]> {
  const data = await esPost({
    size: 10000,
    sort: [{ "@timestamp": { order: "desc" } }],
    query: {
      bool: {
        must: [
          { exists: { field: "data.srcip" } },
          { range: { "@timestamp": { gte: "now-24h" } } },
          { range: { "rule.level": { gte: 8 } } },
        ],
      },
    },
    _source: ["data.srcip", "rule.level", "rule.description", "rule.mitre", "@timestamp"],
  });

  const ipMap = new Map<string, {
    hits: number;
    maxLevel: number;
    topRule: string;
    mitreIds: Set<string>;
    mitreTactics: Set<string>;
    lastSeen: string;
  }>();

  for (const hit of data.hits?.hits ?? []) {
    const s  = hit._source ?? {};
    const ip = s.data?.srcip;
    if (!ip) continue;

    const level  = Number(s.rule?.level ?? 0);
    const desc   = String(s.rule?.description ?? "");
    const mIds   = toArr<string>(s.rule?.mitre?.id);
    const mTacts = toArr<string>(s.rule?.mitre?.tactic);
    const ts     = String(s["@timestamp"] ?? "");

    const existing = ipMap.get(ip);
    if (existing) {
      existing.hits++;
      if (level > existing.maxLevel) { existing.maxLevel = level; existing.topRule = desc; }
      mIds.forEach((id) => existing.mitreIds.add(id));
      mTacts.forEach((t) => existing.mitreTactics.add(t));
      if (ts > existing.lastSeen) existing.lastSeen = ts;
    } else {
      ipMap.set(ip, {
        hits: 1, maxLevel: level, topRule: desc,
        mitreIds: new Set(mIds), mitreTactics: new Set(mTacts), lastSeen: ts,
      });
    }
  }

  return Array.from(ipMap.entries())
    .map(([ip, d]) => ({
      ip,
      hits:         d.hits,
      maxLevel:     d.maxLevel,
      topRule:      d.topRule,
      mitreIds:     Array.from(d.mitreIds),
      mitreTactics: Array.from(d.mitreTactics),
      lastSeen:     fmtDateTime(d.lastSeen),
    }))
    .sort((a, b) => b.maxLevel - a.maxLevel || b.hits - a.hits);
}
