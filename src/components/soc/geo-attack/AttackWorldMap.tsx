// ─────────────────────────────────────────────────────────────────────────────
//  HQG Security SOC Platform – Global Cyber Attack World Map
// ─────────────────────────────────────────────────────────────────────────────
//  Shodan / Kaspersky-style heatmap + animated scatter on an ECharts world map.
//
//  Features:
//    • Country density heatmap (blue → yellow → red intensity gradient)
//    • EffectScatter pulsing dots per attack origin (coloured by severity)
//    • AI-detected anomalies rendered as red glowing beacons with fast pulse
//    • SOC target pulsing yellow beacon
//    • Empty state with Vietnamese message
//    • Live badge overlay

import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { EffectScatterChart, HeatmapChart } from "echarts/charts";
import {
  GeoComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import type { EChartsOption } from "echarts";
import { useEffect, useMemo } from "react";
import { Crosshair } from "lucide-react";
import { ensureWorldMapRegistered, getSocTarget } from "@/utils/worldMap";
import type { GeoAttackEvent } from "@/hooks/useGeoAttackPage";

echarts.use([
  GeoComponent,
  TooltipComponent,
  VisualMapComponent,
  EffectScatterChart,
  HeatmapChart,
  CanvasRenderer,
]);

// ── Severity colour palette ───────────────────────────────────────────────────

const SEV = {
  low:      { color: "#38bdf8", glow: "rgba(56,189,248,0.50)" },
  medium:   { color: "#facc15", glow: "rgba(250,204,21,0.60)" },
  high:     { color: "#f97316", glow: "rgba(249,115,22,0.60)" },
  critical: { color: "#ff3b3b", glow: "rgba(255,59,59,0.80)" },
} as const;

type SevKey = keyof typeof SEV;

function sevKey(level: number): SevKey {
  if (level >= 14) return "critical";
  if (level >= 10) return "high";
  if (level >= 7)  return "medium";
  return "low";
}

const SEV_LABEL: Record<SevKey, string> = {
  low:      "Thấp",
  medium:   "T. Bình",
  high:     "Cao",
  critical: "Nghiêm trọng",
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  events:   GeoAttackEvent[];
  loading?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

const AttackWorldMap = ({ events, loading }: Props) => {
  useEffect(() => {
    ensureWorldMapRegistered();
  }, []);

  const option = useMemo<EChartsOption>(() => {
    const target = getSocTarget();

    // ─── Aggregate events by source IP ─────────────────────────────────────
    type AggNode = {
      lon:      number;
      lat:      number;
      count:    number;
      maxLevel: number;
      isAI:     boolean;
      country:  string;
      srcIp:    string;
    };

    const ipAgg = new Map<string, AggNode>();

    for (const e of events) {
      const existing = ipAgg.get(e.srcIp);
      if (existing) {
        existing.count    += 1;
        existing.maxLevel  = Math.max(existing.maxLevel, e.level);
        if (e.isAI) existing.isAI = true;
      } else {
        ipAgg.set(e.srcIp, {
          lon:      e.lon,
          lat:      e.lat,
          count:    1,
          maxLevel: e.level,
          isAI:     e.isAI,
          country:  e.country,
          srcIp:    e.srcIp,
        });
      }
    }

    const aggPoints  = [...ipAgg.values()];
    const maxCount   = Math.max(1, ...aggPoints.map((p) => p.count));

    // Heatmap – all origins plotted as density layer [lon, lat, intensity]
    const heatmapData = aggPoints.map((p) => [p.lon, p.lat, p.count]);

    const regularPoints = aggPoints.filter((p) => !p.isAI);
    const aiPoints      = aggPoints.filter((p) => p.isAI);

    return {
      backgroundColor: "transparent",

      tooltip: {
        trigger:         "item",
        confine:         true,
        backgroundColor: "rgba(2,6,23,0.96)",
        borderColor:     "rgba(51,65,85,0.9)",
        borderWidth:     1,
        textStyle:       { color: "#e2e8f0", fontFamily: "JetBrains Mono", fontSize: 12 },
        formatter: (params: any) => {
          if (!Array.isArray(params.value)) return params.name ?? "";
          const count  = Number(params.value[2] ?? 1);
          const isAI   = params.seriesName === "__ai__";
          const sk     = sevKey(params.data?.maxLevel ?? 0);
          const col    = isAI ? "#ff3b3b" : SEV[sk].color;
          const label  = isAI ? "🤖 AI Phát hiện bất thường" : `⚡ Tấn công – ${SEV_LABEL[sk]}`;
          return [
            `<div style="text-transform:uppercase;letter-spacing:0.18em;color:${col};margin-bottom:6px">${label}</div>`,
            `<div style="font-size:13px;font-weight:600;margin-bottom:4px">${params.data?.country ?? params.name ?? "—"}</div>`,
            `<div>IP: <span style="color:#facc15">${params.data?.srcIp ?? "—"}</span></div>`,
            `<div>${count.toLocaleString("vi-VN")} sự kiện</div>`,
          ].join("");
        },
      },

      // ─── Visual map: controls heatmap colour scale only (seriesIndex 0) ──
      visualMap: {
        show:        false,
        type:        "continuous",
        min:         0,
        max:         maxCount,
        seriesIndex: [0],
        inRange: {
          color: [
            "rgba(56,189,248,0.00)",
            "rgba(56,189,248,0.28)",
            "rgba(250,204,21,0.45)",
            "rgba(239,68,68,0.65)",
            "rgba(255,59,59,0.90)",
          ],
        },
      },

      // ─── World map base ───────────────────────────────────────────────────
      geo: {
        map:    "world-soc",
        roam:   true,
        zoom:   1.15,
        center: [20, 14],
        itemStyle: {
          areaColor:   "#060f1e",
          borderColor: "#163158",
          borderWidth: 0.65,
        },
        emphasis: {
          itemStyle: { areaColor: "#0d2240" },
          label:     { show: false },
        },
        silent: true,
      },

      series: [
        // ─── 0: Heatmap density layer ─────────────────────────────────────
        {
          type:             "heatmap",
          coordinateSystem: "geo",
          data:             heatmapData,
          pointSize:        22,
          blurSize:         32,
          zlevel:           1,
        } as any,

        // ─── 1: Regular attack origins (severity-coloured EffectScatter) ──
        {
          name:             "__wazuh__",
          type:             "effectScatter",
          coordinateSystem: "geo",
          zlevel:           3,
          rippleEffect: {
            brushType: "stroke",
            scale:     3.5,
            period:    2.8,
          },
          symbolSize: (v: number[]) =>
            Math.max(5, Math.min(18, (v[2] ?? 1) * 1.4 + 5)),
          data: regularPoints.map((p) => {
            const sk  = sevKey(p.maxLevel);
            const col = SEV[sk];
            return {
              name:     p.country,
              value:    [p.lon, p.lat, p.count],
              srcIp:    p.srcIp,
              country:  p.country,
              maxLevel: p.maxLevel,
              itemStyle: {
                color:       col.color,
                shadowBlur:  sk === "critical" ? 22 : sk === "high" ? 14 : 10,
                shadowColor: col.glow,
              },
            };
          }),
        },

        // ─── 2: AI-detected anomalies (red, fast pulsing beacon) ──────────
        {
          name:             "__ai__",
          type:             "effectScatter",
          coordinateSystem: "geo",
          zlevel:           5,
          rippleEffect: {
            brushType: "stroke",
            scale:     5,
            period:    1.4,
          },
          symbolSize: (v: number[]) =>
            Math.max(8, Math.min(22, (v[2] ?? 1) * 1.6 + 7)),
          data: aiPoints.map((p) => ({
            name:    p.country,
            value:   [p.lon, p.lat, p.count],
            srcIp:   p.srcIp,
            country: p.country,
            maxLevel: p.maxLevel,
            itemStyle: {
              color:       "#ff3b3b",
              shadowBlur:  26,
              shadowColor: "rgba(255,59,59,0.88)",
            },
          })),
        },

        // ─── 3: SOC target – pulsing yellow beacon ────────────────────────
        {
          type:             "effectScatter",
          coordinateSystem: "geo",
          zlevel:           6,
          rippleEffect: { brushType: "stroke", scale: 7, period: 3 },
          symbolSize:   16,
          itemStyle: {
            color:       "#facc15",
            shadowBlur:  24,
            shadowColor: "rgba(250,204,21,0.88)",
          },
          data: [{ name: target.name, value: [...target.coords, 1] }],
        },
      ],
    };
  }, [events]);

  const isEmpty = !loading && events.length === 0;

  return (
    <section className="soc-card overflow-hidden border-info/20 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.10),transparent_26%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(3,10,22,0.96))]">

      {/* ── Card header ──────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-info">
            <Crosshair className="h-4 w-4" />
            <span className="text-[11px] font-mono uppercase tracking-[0.28em] text-info/80">
              Bản đồ tấn công mạng toàn cầu
            </span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Mật độ nguồn tấn công theo vùng địa lý
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Heatmap thời gian thực từ Wazuh &amp; AI anomaly detection.
            Điểm đỏ nhấp nháy nhanh = phát hiện của AI.
          </p>
        </div>

        {/* ── Severity legend ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-mono">
          {(["low", "medium", "high", "critical"] as SevKey[]).map((sk) => (
            <span key={sk} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: SEV[sk].color,
                  boxShadow: `0 0 7px ${SEV[sk].glow}`,
                }}
              />
              <span className="text-muted-foreground">{SEV_LABEL[sk]}</span>
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: "#ff3b3b",
                boxShadow: "0 0 8px rgba(255,59,59,0.88)",
              }}
            />
            <span className="text-danger font-semibold">AI</span>
          </span>
        </div>
      </div>

      {/* ── Map viewport ─────────────────────────────────────────────────── */}
      <div className="relative h-[580px] overflow-hidden rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(6,12,24,0.98),rgba(2,6,23,0.92))]">
        {/* Ambient glow overlays */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.10),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[rgba(2,6,23,0.6)] to-transparent" />

        {loading && events.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="animate-pulse text-xs font-mono text-muted-foreground">
              Đang đồng bộ dữ liệu địa lý…
            </p>
          </div>
        ) : isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <div className="rounded-full border border-border/50 bg-secondary/30 p-6">
              <Crosshair className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-mono text-muted-foreground">
              Chưa có dữ liệu tấn công mạng.
            </p>
            <p className="text-xs text-muted-foreground/50">
              Bản đồ sẽ cập nhật khi có cảnh báo từ nguồn tấn công bên ngoài.
            </p>
          </div>
        ) : (
          <ReactEChartsCore
            echarts={echarts}
            option={option}
            notMerge
            lazyUpdate
            style={{ height: "100%", width: "100%" }}
          />
        )}

        {/* Live badge */}
        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-success/30 bg-background/80 px-3 py-1 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-success">Trực tiếp</span>
        </div>
      </div>
    </section>
  );
};

export default AttackWorldMap;
