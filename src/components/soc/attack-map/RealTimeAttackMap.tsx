import { getAttackSeverity } from "@/utils/attackMap";
import { ensureWorldMapRegistered, getCountryCoord, getSocTarget } from "@/utils/worldMap";
import type { AttackMapAlert } from "@/services/wazuhApi";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import {
  EffectScatterChart,
  LinesChart,
  ScatterChart,
} from "echarts/charts";
import {
  GeoComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import type { EChartsOption } from "echarts";
import { Crosshair, Shield } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

echarts.use([
  GeoComponent,
  TooltipComponent,
  VisualMapComponent,
  LinesChart,
  ScatterChart,
  EffectScatterChart,
  CanvasRenderer,
]);

// ── Color palette (spec: neon yellow default, red critical) ───────────────────

const LINE_COLORS = {
  low: "#38bdf8",            // cyan
  medium: "#facc15",         // neon yellow
  high: "#f97316",           // orange
  critical: "#ff3b3b",       // red (pulsing)
} as const;

const LINE_GLOWS = {
  low: "rgba(56,189,248,0.35)",
  medium: "rgba(250,204,21,0.50)",
  high: "rgba(249,115,22,0.50)",
  critical: "rgba(255,59,59,0.70)",
} as const;

type SevKey = keyof typeof LINE_COLORS;

function sevKey(level: number): SevKey {
  if (level >= 14) return "critical";
  if (level >= 10) return "high";
  if (level >= 7) return "medium";
  return "low";
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  alerts: AttackMapAlert[];
  loading?: boolean;
}

/** Maximum attack traces rendered to keep ECharts smooth with large datasets. */
const MAX_TRACES = 120;

const RealTimeAttackMap = ({ alerts, loading }: Props) => {
  const chartRef = useRef<ReactEChartsCore>(null);

  useEffect(() => {
    ensureWorldMapRegistered();
  }, []);

  // Build ECharts option – memoised on the alert array reference.
  const option = useMemo<EChartsOption>(() => {
    const target = getSocTarget();
    const stream = alerts.slice(0, MAX_TRACES);

    // ── Severity-bucketed line data ───────────────────────────────────────
    const buckets: Record<SevKey, any[]> = {
      low: [],
      medium: [],
      high: [],
      critical: [],
    };

    // ── Attacker origin nodes (aggregated per country) ────────────────────
    const countryNodes = new Map<
      string,
      { name: string; value: [number, number, number]; level: number; count: number }
    >();

    for (const alert of stream) {
      // Prefer direct GeoIP coords → fall back to country centroid
      const fromCoord = alert.coords ?? getCountryCoord(alert.country);
      if (!fromCoord) continue;

      const sk = sevKey(alert.level);

      buckets[sk].push({
        fromName: alert.country || alert.srcIp,
        toName: target.name,
        coords: [fromCoord, target.coords],
        alert,
      });

      // Aggregate origin scatter nodes by country (reduce visual clutter)
      const nodeKey = alert.country || alert.srcIp;
      const existing = countryNodes.get(nodeKey);
      if (existing) {
        existing.count += 1;
        existing.level = Math.max(existing.level, alert.level);
        existing.value = [existing.value[0], existing.value[1], existing.count];
      } else {
        countryNodes.set(nodeKey, {
          name: nodeKey,
          value: [fromCoord[0], fromCoord[1], 1],
          level: alert.level,
          count: 1,
        });
      }
    }

    // ── Build line series per severity tier ────────────────────────────────
    const lineSeries = (["low", "medium", "high", "critical"] as const).map(
      (key) => ({
        type: "lines" as const,
        coordinateSystem: "geo" as const,
        zlevel: key === "critical" ? 5 : key === "high" ? 4 : 2,
        effect: {
          show: true,
          period: key === "critical" ? 1.6 : key === "high" ? 2.4 : 3.6,
          trailLength: key === "critical" ? 0.38 : 0.22,
          symbol: "circle",
          symbolSize: key === "critical" ? 6 : key === "high" ? 4.5 : 3,
          color: LINE_COLORS[key],
        },
        lineStyle: {
          color: LINE_COLORS[key],
          width: key === "critical" ? 2.6 : key === "high" ? 2 : 1.4,
          opacity: key === "critical" ? 0.92 : key === "high" ? 0.72 : 0.5,
          curveness: 0.2,
          shadowBlur: key === "critical" ? 20 : 10,
          shadowColor: LINE_GLOWS[key],
        },
        blendMode: "lighter" as const,
        data: buckets[key],
      }),
    );

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        confine: true,
        backgroundColor: "rgba(2,6,23,0.96)",
        borderColor: "rgba(51,65,85,0.9)",
        borderWidth: 1,
        textStyle: { color: "#e2e8f0", fontFamily: "JetBrains Mono", fontSize: 12 },
        formatter: (params: any) => {
          // Line tooltip – show attack details
          if (params.data?.alert) {
            const a = params.data.alert as AttackMapAlert;
            const sev = getAttackSeverity(a.level);
            return [
              `<div style="text-transform:uppercase;letter-spacing:0.18em;color:${sev.color};margin-bottom:6px">${sev.label} · Level ${a.level}</div>`,
              `<div style="font-size:13px;font-weight:600;margin-bottom:4px">${a.country || "Unknown"} → ${target.name}</div>`,
              `<div style="color:#94a3b8;margin-bottom:3px">${a.description}</div>`,
              `<div>Source: <span style="color:#facc15">${a.srcIp || "—"}</span></div>`,
              a.destIp ? `<div>Target: <span style="color:#38bdf8">${a.destIp}</span></div>` : "",
            ].join("");
          }
          // Scatter tooltip – show origin node
          if (Array.isArray(params.value)) {
            return [
              `<div style="text-transform:uppercase;letter-spacing:0.18em;color:#38bdf8;margin-bottom:6px">Attack Origin</div>`,
              `<div style="font-size:13px;font-weight:600;margin-bottom:4px">${params.name}</div>`,
              `<div>${Number(params.value[2] ?? 0).toLocaleString()} active traces</div>`,
            ].join("");
          }
          return params.name;
        },
      },
      geo: {
        map: "world-soc",
        roam: true,
        zoom: 1.14,
        center: [20, 16],
        itemStyle: {
          areaColor: "#06101e",
          borderColor: "#163158",
          borderWidth: 0.7,
        },
        emphasis: {
          itemStyle: { areaColor: "#0d2240" },
          label: { show: false },
        },
        silent: true,
      },
      series: [
        // ① SOC Target – pulsing yellow beacon
        {
          type: "effectScatter",
          coordinateSystem: "geo",
          zlevel: 6,
          rippleEffect: { brushType: "stroke", scale: 7, period: 3 },
          symbolSize: 16,
          itemStyle: {
            color: "#facc15",
            shadowBlur: 24,
            shadowColor: "rgba(250,204,21,0.85)",
          },
          data: [{ name: target.name, value: [...target.coords, 1] }],
        },
        // ② Attacker origin scatter nodes
        {
          type: "scatter",
          coordinateSystem: "geo",
          zlevel: 3,
          symbolSize: (v: number[]) => Math.max(7, Math.min(20, (v[2] ?? 0) * 1.5 + 5)),
          data: Array.from(countryNodes.values()).map((node) => {
            const sk = sevKey(node.level);
            return {
              name: node.name,
              value: node.value,
              itemStyle: {
                color: LINE_COLORS[sk],
                shadowBlur: sk === "critical" ? 20 : 12,
                shadowColor: LINE_GLOWS[sk],
              },
            };
          }),
        },
        // ③ Attack trace lines (one series per severity tier)
        ...lineSeries,
      ],
    };
  }, [alerts]);

  return (
    <section className="soc-card overflow-hidden border-info/20 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.10),transparent_26%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(3,10,22,0.96))]">
      {/* Card header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-border/80 pb-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-info">
            <Crosshair className="h-4 w-4" />
            <span className="text-[11px] font-mono uppercase tracking-[0.28em] text-info/80">
              Global Cyber Attack Map
            </span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Real-time hostile traffic toward monitored infrastructure
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Live animated attack vectors from Wazuh &amp; Suricata geo-located detections converging on the SOC core.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-mono uppercase tracking-[0.2em] text-primary">
          <Shield className="h-3.5 w-3.5" />
          {getSocTarget().name}
        </div>
      </div>

      {/* Map viewport */}
      <div className="relative h-[580px] overflow-hidden rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(6,12,24,0.98),rgba(2,6,23,0.92))]">
        {/* Top glow overlay */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.10),transparent_70%)]" />
        {/* Bottom vignette */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[rgba(2,6,23,0.6)] to-transparent" />

        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs font-mono text-muted-foreground animate-pulse">
              Synchronizing live geolocation traces…
            </p>
          </div>
        ) : (
          <ReactEChartsCore
            ref={chartRef}
            echarts={echarts}
            option={option}
            notMerge
            lazyUpdate
            style={{ height: "100%", width: "100%" }}
          />
        )}

        {/* Live badge overlay */}
        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-success/30 bg-background/80 px-3 py-1 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-success">Live</span>
        </div>
      </div>
    </section>
  );
};

export default RealTimeAttackMap;