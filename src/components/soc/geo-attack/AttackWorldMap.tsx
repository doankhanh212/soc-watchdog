// ─────────────────────────────────────────────────────────────────────────────
//  Security SOC Platform – Shodan‑style Global Cyber Attack Map
// ─────────────────────────────────────────────────────────────────────────────
//  Visual design inspired by Shodan / Kaspersky cyber‑map:
//    • Animated missile trajectory lines (LinesChart + effect) per severity
//    • EffectScatter pulsing origin dots
//    • AI anomaly beacons – fast‑pulsing, deep‑red
//    • Electric‑blue country borders on a near‑black map canvas
//    • CSS scan‑line overlay for CRT / SOC aesthetic
//    • SOC target – gold ripple beacon
//    • Graceful empty‑state (Vietnamese)

import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { EffectScatterChart, LinesChart } from "echarts/charts";
import { GeoComponent, TooltipComponent } from "echarts/components";
import type { EChartsOption } from "echarts";
import { useEffect, useMemo, useRef } from "react";
import { BrainCircuit, Crosshair } from "lucide-react";
import { ensureWorldMapRegistered, getSocTarget } from "@/utils/worldMap";
import type { GeoAttackEvent } from "@/hooks/useGeoAttackPage";

echarts.use([
  GeoComponent,
  TooltipComponent,
  EffectScatterChart,
  LinesChart,
  CanvasRenderer,
]);

// ── Neon severity palette ─────────────────────────────────────────────────────

const SEV = {
  low: {
    color: "#38bdf8", glow: "rgba(56,189,248,0.45)",
    label: "Thấp",         period: 4.2, width: 1.0, trail: 0.16, zlevel: 2,
  },
  medium: {
    color: "#facc15", glow: "rgba(250,204,21,0.55)",
    label: "Trung bình",  period: 2.8, width: 1.6, trail: 0.22, zlevel: 3,
  },
  high: {
    color: "#f97316", glow: "rgba(249,115,22,0.62)",
    label: "Cao",          period: 2.0, width: 2.0, trail: 0.28, zlevel: 4,
  },
  critical: {
    color: "#ff3b3b", glow: "rgba(255,59,59,0.80)",
    label: "Nghiêm trọng", period: 1.4, width: 2.6, trail: 0.40, zlevel: 5,
  },
} as const;

const AI_SEV = {
  color: "#ff0055", glow: "rgba(255,0,85,0.90)",
  label: "AI Anomaly",    period: 0.9, width: 3.0, trail: 0.48,
};

type SevKey = keyof typeof SEV;

function sevKey(level: number): SevKey {
  if (level >= 14) return "critical";
  if (level >= 10) return "high";
  if (level >= 7)  return "medium";
  return "low";
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  events:   GeoAttackEvent[];
  loading?: boolean;
  /** Latest event to show in the "Latest attack" overlay card */
  latestEvent?: GeoAttackEvent | null;
}

const MAX_TRACES = 180;

// ── Component ─────────────────────────────────────────────────────────────────

const AttackWorldMap = ({ events, loading, latestEvent }: Props) => {
  const chartRef = useRef<ReactEChartsCore>(null);

  useEffect(() => {
    ensureWorldMapRegistered();
  }, []);

  const option = useMemo<EChartsOption>(() => {
    const target = getSocTarget();

    // Aggregate by country (group nearby origins, cap at MAX_TRACES)
    type CountryNode = {
      lon: number; lat: number;
      maxLevel: number; count: number;
      isAI: boolean; country: string; srcIp: string;
    };
    const countryAgg = new Map<string, CountryNode>();

    for (const e of events.slice(0, MAX_TRACES)) {
      const key = e.country || e.srcIp;
      const ex  = countryAgg.get(key);
      if (ex) {
        ex.count++;
        ex.maxLevel = Math.max(ex.maxLevel, e.level);
        if (e.isAI) ex.isAI = true;
      } else {
        countryAgg.set(key, {
          lon: e.lon, lat: e.lat,
          maxLevel: e.level, count: 1,
          isAI: e.isAI, country: e.country, srcIp: e.srcIp,
        });
      }
    }

    const nodes = [...countryAgg.values()];

    type LineDatum = {
      coords: [[number, number], [number, number]];
      value: number;
      maxLevel: number;
      country: string;
      srcIp: string;
    };

    // Severity buckets for line series
    const buckets: Record<SevKey | "ai", LineDatum[]> = {
      low: [], medium: [], high: [], critical: [], ai: [],
    };

    for (const n of nodes) {
      const datum: LineDatum = {
        coords: [[n.lon, n.lat], target.coords as [number, number]],
        value:    n.count,
        maxLevel: n.maxLevel,
        country:  n.country,
        srcIp:    n.srcIp,
      };
      if (n.isAI) buckets.ai.push(datum);
      else        buckets[sevKey(n.maxLevel)].push(datum);
    }

    // Build one lines series per severity tier
    const buildLineSeries = (key: SevKey | "ai", data: LineDatum[]) => {
      const cfg    = key === "ai" ? AI_SEV : SEV[key as SevKey];
      const zlevel = key === "ai" ? 8 : SEV[key as SevKey].zlevel;
      return {
        type:             "lines" as const,
        coordinateSystem: "geo"  as const,
        zlevel,
        blendMode: "lighter" as const,
        effect: {
          show:         true,
          period:       cfg.period,
          trailLength:  cfg.trail,
          symbol:       "circle",
          symbolSize:   key === "ai" ? 5 : key === "critical" ? 5 : 3.5,
          color:        cfg.color,
        },
        lineStyle: {
          color:       cfg.color,
          width:       cfg.width,
          opacity:     key === "ai" ? 0.95 : key === "critical" ? 0.88 : 0.55,
          curveness:   0.26,
          shadowBlur:  key === "ai" ? 28 : key === "critical" ? 18 : 8,
          shadowColor: cfg.glow,
        },
        data,
      };
    };

    const regularNodes = nodes.filter((n) => !n.isAI);
    const aiNodes      = nodes.filter((n) =>  n.isAI);

    return {
      backgroundColor: "transparent",

      tooltip: {
        trigger:         "item",
        confine:         true,
        backgroundColor: "rgba(1,4,15,0.97)",
        borderColor:     "rgba(14,58,101,0.95)",
        borderWidth:     1,
        textStyle:       { color: "#c8daff", fontFamily: "JetBrains Mono", fontSize: 12 },
        formatter: (params: any) => {
          const d        = params.data ?? {};
          const country  = d.country  ?? params.name ?? "—";
          const srcIp    = d.srcIp    ?? "—";
          const count    = d.value    ?? 1;
          const isAI     = params.seriesName === "__ai_scatter__";
          const maxLev   = d.maxLevel ?? 0;
          const sk       = sevKey(maxLev);
          const col      = isAI ? "#ff0055" : SEV[sk].color;
          const label    = isAI
            ? "🤖  AI Phát hiện bất thường"
            : `⚡  ${SEV[sk].label} · Level ${maxLev}`;
          const countNum = Array.isArray(count) ? count[2] : count;
          return [
            `<div style="color:${col};letter-spacing:.14em;text-transform:uppercase;font-size:10px;margin-bottom:5px">${label}</div>`,
            `<div style="font-size:13px;font-weight:600;color:#e8f4ff;margin-bottom:3px">${country}</div>`,
            `<div style="color:#8da8c8">IP: <span style="color:#facc15">${srcIp}</span></div>`,
            `<div style="color:#8da8c8">${Number(countNum).toLocaleString("vi-VN")} sự kiện</div>`,
          ].join("");
        },
      },

      // ── World map ──────────────────────────────────────────────────────────
      geo: {
        map:    "world-soc",
        roam:   true,
        zoom:   1.12,
        center: [18, 14],
        itemStyle: {
          areaColor:   "#020b19",
          borderColor: "#0d3a6a",
          borderWidth: 0.9,
        },
        emphasis: {
          itemStyle: {
            areaColor:   "#071e3d",
            borderColor: "#1565a0",
          },
          label: { show: false },
        },
        silent: true,
      },

      series: [
        // — Trajectory lines per severity —
        buildLineSeries("low",      buckets.low),
        buildLineSeries("medium",   buckets.medium),
        buildLineSeries("high",     buckets.high),
        buildLineSeries("critical", buckets.critical),
        buildLineSeries("ai",       buckets.ai),

        // — Origin scatter dots (severity colours) —
        {
          type:             "effectScatter",
          coordinateSystem: "geo",
          zlevel:           6,
          rippleEffect:     { brushType: "stroke", scale: 3.5, period: 2.6 },
          symbolSize: (v: number[]) =>
            Math.max(5, Math.min(18, (v[2] ?? 1) * 1.4 + 5)),
          data: regularNodes.map((n) => {
            const sk = sevKey(n.maxLevel);
            return {
              name:     n.country,
              value:    [n.lon, n.lat, n.count],
              country:  n.country,
              srcIp:    n.srcIp,
              maxLevel: n.maxLevel,
              itemStyle: {
                color:       SEV[sk].color,
                shadowBlur:  sk === "critical" ? 24 : sk === "high" ? 16 : 10,
                shadowColor: SEV[sk].glow,
              },
            };
          }),
        },

        // — AI anomaly beacons (fast deep‑red pulse) —
        {
          name:             "__ai_scatter__",
          type:             "effectScatter",
          coordinateSystem: "geo",
          zlevel:           9,
          rippleEffect:     { brushType: "stroke", scale: 6, period: 1.0 },
          symbolSize: (v: number[]) =>
            Math.max(8, Math.min(22, (v[2] ?? 1) * 1.8 + 8)),
          data: aiNodes.map((n) => ({
            name:     n.country,
            value:    [n.lon, n.lat, n.count],
            country:  n.country,
            srcIp:    n.srcIp,
            maxLevel: n.maxLevel,
            itemStyle: {
              color:       "#ff0055",
              shadowBlur:  30,
              shadowColor: "rgba(255,0,85,0.90)",
            },
          })),
        },

        // — SOC target — gold ripple beacon —
        {
          type:             "effectScatter",
          coordinateSystem: "geo",
          zlevel:           10,
          rippleEffect:     { brushType: "stroke", scale: 8, period: 3.5 },
          symbolSize:       18,
          silent:           true,
          itemStyle: {
            color:       "#facc15",
            shadowBlur:  36,
            shadowColor: "rgba(250,204,21,0.92)",
          },
          data: [{ name: target.name, value: [...target.coords, 1] }],
        },
      ],
    };
  }, [events]);

  const isEmpty = !loading && events.length === 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#0d3a6a]/70 bg-[#010810]">

      {/* ── Header bar ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#0d3a6a]/60 bg-[#010d1f] px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Crosshair className="h-4 w-4 text-[#38bdf8]" />
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#38bdf8]/70">
              Bản đồ tấn công mạng toàn cầu
            </div>
            <div className="mt-0.5 text-sm font-semibold text-[#c8daff]">
              Mật độ nguồn tấn công theo vùng địa lý
            </div>
          </div>
        </div>

        {/* Severity legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-mono">
          {(["low", "medium", "high", "critical"] as SevKey[]).map((sk) => (
            <span key={sk} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: SEV[sk].color, boxShadow: `0 0 6px ${SEV[sk].glow}` }}
              />
              <span style={{ color: SEV[sk].color }}>{SEV[sk].label}</span>
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: "#ff0055", boxShadow: "0 0 7px rgba(255,0,85,.9)" }}
            />
            <span className="font-semibold" style={{ color: "#ff0055" }}>AI</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: "#facc15", boxShadow: "0 0 7px rgba(250,204,21,.9)" }}
            />
            <span style={{ color: "#facc15" }}>SOC Core</span>
          </span>
        </div>
      </div>

      {/* ── Map viewport ─────────────────────────────────────────────────── */}
      <div className="relative h-[600px] overflow-hidden bg-[#010810]">

        {/* CRT scan-line overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,8,20,0.06) 2px,rgba(0,8,20,0.06) 4px)",
          }}
        />

        {/* Top glow arc */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-40 bg-[radial-gradient(ellipse_150%_60%_at_50%_-10%,rgba(14,58,101,0.35),transparent_65%)]" />
        {/* Bottom vignette */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-[#010810] to-transparent" />

        {loading && events.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="animate-pulse text-xs font-mono" style={{ color: "#38bdf8" }}>
              Đang đồng bộ dữ liệu địa lý…
            </p>
          </div>
        ) : isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-5">
            <div
              className="rounded-full p-8"
              style={{ border: "1px solid rgba(14,58,101,0.5)", background: "rgba(1,13,31,0.6)" }}
            >
              <Crosshair className="h-12 w-12" style={{ color: "rgba(14,58,101,0.6)" }} />
            </div>
            <p className="text-sm font-mono" style={{ color: "#3a7abd" }}>
              Chưa có dữ liệu tấn công mạng.
            </p>
            <p className="text-xs" style={{ color: "rgba(58,122,189,0.5)" }}>
              Bản đồ sẽ cập nhật khi có cảnh báo từ nguồn tấn công bên ngoài.
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

        {/* ── Live badge ────────────────────────────────────────────────── */}
        <div
          className="pointer-events-none absolute left-4 top-4 z-30 flex items-center gap-2 rounded-full px-3 py-1 backdrop-blur-sm"
          style={{
            border:     "1px solid rgba(56,189,248,0.25)",
            background: "rgba(1,8,24,0.82)",
          }}
        >
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: "#38bdf8" }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: "#38bdf8" }}
            />
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: "#38bdf8" }}>
            Trực tiếp
          </span>
        </div>

        {/* ── Latest attack overlay ─────────────────────────────────────── */}
        {latestEvent && (
          <div
            className="pointer-events-none absolute bottom-6 right-4 z-30 rounded-xl px-4 py-3 backdrop-blur-sm"
            style={{
              border:     `1px solid ${latestEvent.isAI ? "rgba(255,0,85,0.40)" : "rgba(14,58,101,0.70)"}`,
              background: "rgba(1,8,24,0.90)",
              maxWidth:   "300px",
            }}
          >
            <div
              className="mb-1 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em]"
              style={{ color: latestEvent.isAI ? "#ff0055" : "#38bdf8" }}
            >
              {latestEvent.isAI ? (
                <BrainCircuit className="h-3 w-3" />
              ) : (
                <Crosshair className="h-3 w-3" />
              )}
              {latestEvent.isAI ? "AI Phát hiện" : "Tấn công mới nhất"}
            </div>
            <div className="text-sm font-semibold" style={{ color: "#c8daff" }}>
              {latestEvent.country || "Unknown"}
            </div>
            <div className="mt-0.5 font-mono text-xs" style={{ color: "#facc15" }}>
              {latestEvent.srcIp}
            </div>
            <div
              className="mt-1 line-clamp-1 text-[11px]"
              style={{ color: "rgba(140,170,200,0.8)" }}
            >
              {latestEvent.description}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AttackWorldMap;
