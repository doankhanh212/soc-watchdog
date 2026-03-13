/**
 * AttackOriginPanel — lightweight replacement for the heavy ECharts world map.
 *
 * Two Recharts charts (no world-atlas / topojson / d3-geo):
 *   1. Horizontal bar chart of top attack origins (countries or IPs as fallback).
 *   2. Stacked bar chart of hourly attack volumes bucketed by severity.
 */
import { useMemo } from "react";
import { Activity, Globe2, Network } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, LabelList, CartesianGrid,
} from "recharts";
import lookup from "country-code-lookup";
import "flag-icons/css/flag-icons.min.css";
import type { AttackMapData, AttackMapAlert } from "@/services/wazuhApi";

interface Props {
  data: AttackMapData | undefined;
  loading?: boolean;
}

const TOP_N = 10;

const SEV_COLORS = {
  critical: "#ef4444",
  high:     "#f97316",
  medium:   "#facc15",
  low:      "#38bdf8",
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

const IP_RE = /^\d{1,3}\.\d{1,3}/;

function toIso(name: string): string {
  if (!name || name === "Others") return "un";
  const overrides: Record<string, string> = {
    "United States": "us", "United States of America": "us",
    "Russia": "ru", "South Korea": "kr", "Vietnam": "vn",
    "Iran": "ir", "Taiwan": "tw", "United Kingdom": "gb", "China": "cn",
    "Germany": "de", "France": "fr", "Brazil": "br", "India": "in",
    "Netherlands": "nl", "Singapore": "sg", "Japan": "jp",
  };
  if (overrides[name]) return overrides[name];
  return lookup.byCountry(name)?.iso2?.toLowerCase() ?? "un";
}

// ── Custom Y-axis tick (flag + label) ─────────────────────────────────────────

const BarYTick = ({ x, y, payload, isIp }: any) => {
  const val: string = payload.value;
  const showFlag = !isIp && val !== "Others";

  return (
    <g transform={`translate(${x},${y})`}>
      <foreignObject x={-140} y={-10} width={135} height={20}>
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            width: "100%",
            height: "100%",
            gap: 6,
            paddingRight: 6,
          }}
        >
          <span
            className="text-xs font-mono text-muted-foreground truncate text-right"
            style={{ maxWidth: isIp ? 125 : 90 }}
            title={val}
          >
            {val}
          </span>
          {showFlag && (
            <span
              className={`fi fi-${toIso(val)} rounded-sm shadow-sm`}
              style={{ width: 16, height: 12, flexShrink: 0 }}
            />
          )}
        </div>
      </foreignObject>
    </g>
  );
};

// ── Hourly timeline helper ────────────────────────────────────────────────────

function buildHourly(alerts: AttackMapAlert[]) {
  const m = new Map<
    string,
    { hour: string; low: number; medium: number; high: number; critical: number }
  >();

  for (const a of alerts) {
    const h = (a.rawTimestamp ?? "").slice(0, 13);
    if (!h) continue;
    if (!m.has(h)) m.set(h, { hour: h.slice(11) + ":00", low: 0, medium: 0, high: 0, critical: 0 });
    const b = m.get(h)!;
    if (a.level >= 14)      b.critical++;
    else if (a.level >= 10) b.high++;
    else if (a.level >= 7)  b.medium++;
    else                    b.low++;
  }

  return [...m.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

// ── Component ─────────────────────────────────────────────────────────────────

const AttackOriginPanel = ({ data, loading }: Props) => {
  // Prefer country data; fall back to top IPs when geo-enrichment isn't available.
  const { bars, isIp } = useMemo(() => {
    const countries = [...(data?.topCountries ?? [])].sort((a, b) => b.count - a.count);
    const ips       = [...(data?.topIps       ?? [])].sort((a, b) => b.count - a.count);
    const useIp     = countries.length === 0;
    const src       = useIp ? ips : countries;

    const top    = src.slice(0, TOP_N);
    const rest   = src.slice(TOP_N).reduce((s, e) => s + e.count, 0);
    const result = rest > 0 ? [...top, { label: "Others", count: rest }] : top;

    return { bars: result, isIp: useIp };
  }, [data]);

  const hourly = useMemo(() => buildHourly(data?.alerts ?? []), [data]);

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <section className="soc-card space-y-4">
        <div className="h-7 w-56 animate-pulse rounded bg-secondary/30" />
        <div className="h-[280px] animate-pulse rounded-xl bg-secondary/20" />
        <div className="h-[150px] animate-pulse rounded-xl bg-secondary/20" />
      </section>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section className="soc-card space-y-6">
      {/* Header */}
      <div className="border-b border-border/80 pb-4">
        <div className="mb-2 flex items-center gap-2 text-info">
          <Globe2 className="h-4 w-4" />
          <span className="text-[11px] font-mono uppercase tracking-[0.28em] text-info/80">
            Nguồn gốc tấn công
          </span>
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Phân tích nguồn tấn công &amp; phân bố theo giờ
        </h2>
      </div>

      {/* ── Top origins bar chart ─────────────────────────────────────────── */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          {isIp
            ? <Network className="h-3.5 w-3.5 text-primary" />
            : <Globe2  className="h-3.5 w-3.5 text-info" />}
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            {isIp ? "Top IP tấn công" : "Top quốc gia tấn công"}
          </span>
        </div>

        {bars.length === 0 ? (
          <div className="flex h-36 items-center justify-center text-center text-xs font-mono text-muted-foreground">
            Chưa có dữ liệu nguồn tấn công.
            <br />
            Đảm bảo Suricata / Wazuh đang ghi nhận cảnh báo có trường IP nguồn.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(180, bars.length * 28)}>
            <BarChart
              layout="vertical"
              data={bars}
              margin={{ top: 2, right: 55, left: 10, bottom: 2 }}
              barCategoryGap={4}
            >
              <defs>
                <linearGradient id="aop-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>

              <XAxis type="number" hide />
              <YAxis
                dataKey="label"
                type="category"
                width={140}
                tick={<BarYTick isIp={isIp} />}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [v.toLocaleString(), "tấn công"]}
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: "JetBrains Mono",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                labelStyle={{ color: "hsl(var(--foreground))", marginBottom: 4 }}
                cursor={{ fill: "hsl(var(--accent) / 0.1)", radius: 4 }}
              />

              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                {bars.map((entry, i) => {
                  const isTop3 = i < 3 && entry.label !== "Others";
                  return (
                    <Cell
                      key={i}
                      fill={isTop3 ? "url(#aop-grad)" : "hsl(var(--secondary))"}
                      stroke={isTop3 ? "none" : "hsl(var(--border))"}
                      strokeWidth={1}
                    />
                  );
                })}
                <LabelList
                  dataKey="count"
                  position="right"
                  formatter={(v: number) => v.toLocaleString()}
                  style={{
                    fill: "hsl(var(--foreground))",
                    fontSize: 12,
                    fontFamily: "JetBrains Mono",
                    opacity: 0.8,
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Hourly severity stacked chart ─────────────────────────────────── */}
      {hourly.length > 0 ? (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Phân bố cảnh báo theo giờ (24h gần nhất)
            </span>
          </div>

          <ResponsiveContainer width="100%" height={130}>
            <BarChart
              data={hourly}
              margin={{ top: 0, right: 8, left: -22, bottom: 0 }}
              barCategoryGap={2}
            >
              <CartesianGrid vertical={false} stroke="hsl(var(--border) / 0.3)" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 9, fontFamily: "JetBrains Mono", fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 11,
                  fontFamily: "JetBrains Mono",
                }}
                labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: 4 }}
                cursor={{ fill: "hsl(var(--accent) / 0.08)", radius: 3 }}
              />
              <Bar dataKey="critical" name="Critical" stackId="s" fill={SEV_COLORS.critical} />
              <Bar dataKey="high"     name="High"     stackId="s" fill={SEV_COLORS.high} />
              <Bar dataKey="medium"   name="Medium"   stackId="s" fill={SEV_COLORS.medium} />
              <Bar dataKey="low"      name="Low"      stackId="s" fill={SEV_COLORS.low} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-2 flex flex-wrap justify-end gap-4">
            {(["critical", "high", "medium", "low"] as const).map((k) => (
              <span key={k} className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: SEV_COLORS[k] }} />
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex h-20 items-center justify-center text-xs font-mono text-muted-foreground">
          Không đủ dữ liệu để vẽ biểu đồ phân bố theo giờ.
        </div>
      )}
    </section>
  );
};

export default AttackOriginPanel;
